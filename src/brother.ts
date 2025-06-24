import ipp from '@sealsystems/ipp';
import util from 'node:util';
import pngparse from 'pngparse';

const parseFile = util.promisify(pngparse.parseFile);
const parse = util.promisify(pngparse.parse);

export interface PrintOptions {
  /** default: 128 */
  blackwhiteThreshold?: number;
  /** default: false */
  highResolution?: boolean;
  /** default: 12  */
  tapeWidth?: 12 | 18 | 24;
}

type InternalOptions = Required<PrintOptions>;
type ParsedImageData = ImageData & { channels: 1 | 2 | 3 | 4 };
type PixelMatrix = { height: number, width: number, data: number[][] };

function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

function convertToBlackAndWhiteMatrix(image: ParsedImageData, threshold: number): PixelMatrix {
  const rows: number[][] = [];

  for (let y = 0; y < image.height; y++) {
    const cols: number[] = [];

    for (let x = 0; x < image.width; x++) {
      let pos = x + image.width * y;

      pos = pos * image.channels;

      // 1 channel : grayscale
      // 2 channels: grayscale + alpha
      // 3 channels: RGB
      // 4 channels: RGBA
      switch (image.channels) {
        case 1:
          cols.push(image.data[pos] < threshold ? 1 : 0);
          break;

        case 2:
          cols.push((image.data[pos] * image.data[pos + 1] / 255) < threshold ? 1 : 0);
          break;

        case 3:
          cols.push((0.21 * image.data[pos] + 0.72 * image.data[pos + 1] + 0.07 * image.data[pos + 2]) < threshold ? 1 : 0);
          break;

        case 4:
          cols.push(((0.21 * image.data[pos] + 0.72 * image.data[pos + 1] + 0.07 * image.data[pos + 2]) * image.data[pos + 3] / 255) < threshold ? 1 : 0);
          break;
      }
    }

    rows.push(cols);
  }

  return {
    height: image.height,
    width: image.width,
    data: rows,
  };
}

function convertToLabelBuffer(
  pixelMatrix: PixelMatrix,
  tapeWidth: number,
  highResolution: boolean,
) {
  const data = [
    // Invalidate
    Buffer.alloc(400),

    // Initialize
    Buffer.from([0x1B, 0x40]),

    // Switch to Raster Mode
    Buffer.from([0x1B, 0x69, 0x61, 0x01]),

    // Print information command — Sets tape width
    // 0x02 Media type
    // 0x04 Media width
    // 0x08 Media length
    // 0x40 Priority given to print quality(Not used)
    // 0x80 Printer recovery always on
    Buffer.from([0x1B, 0x69, 0x7A, 0x84, 0x00, tapeWidth, 0x00, 0xAA, 0x02, 0x00, 0x00, 0x00, 0x00]),

    // Various mode settings - Auto Cut
    Buffer.from([0x1B, 0x69, 0x4D, 0x40]),

    // Cut per label setting - 0x01 -> each label
    Buffer.from([0x1B, 0x69, 0x41, 0x01]),

    // Advanced Setting Mode
    // 2bit half-cut, 3bit no chain printing, 4bit special tape, 6bit high-res, 7bit mirror
    Buffer.from([0x1B, 0x69, 0x4B, 0x0C | ((highResolution ? 1 : 0) << 6)]),

    // Margin feed amount - 28 dots (2mm)
    Buffer.from([0x1B, 0x69, 0x64, 14 * (highResolution ? 2 : 1), 0x00]),

    // Enable TIFF - Compression
    // ..on P750W seems like has an issue with 0x1A command and doesn't cut or return back to idle mode
    // unless TIFF compression is enabled.
    Buffer.from([0x4D, 0x02]),
  ];

  // Iterate over Image matrix
  for (let x = 0; x < pixelMatrix.width; x++) {
    // Each row has 3 bytes for command + 1 TIFF byte + 16 bytes for raster
    let rowBuffer = Buffer.alloc(20);

    // Raster Row Command
    rowBuffer[0] = 0x47;
    rowBuffer[1] = 0x11; // 17
    rowBuffer[3] = 0x0F;

    let margin = (tapeWidth === 12) ? 21 : 0;
    for (let y = 0; y < pixelMatrix.height; y++) {
      if (pixelMatrix.data[y][x] == 1) {
        let byteNum = (Math.floor((y + margin) / 8) + 4); // 3 for command + 1 for TIFF compression length byte
        let bitOffset = (y + margin) % 8;
        rowBuffer[byteNum] |= (1 << 7 - bitOffset);
      }
    }
    data.push(rowBuffer);
  }

  // Debugging
  // data.map(row => console.log(row));

  // Send print + cut command
  data.push(Buffer.from([0x1A]));
  return Buffer.concat(data);
}

function resolveOptions(options: PrintOptions = {}): InternalOptions {
  return {
    blackwhiteThreshold: 128,
    highResolution: false,
    tapeWidth: 12 as const,
    ...options,
  };
}

async function print(
  printerUrl: string,
  input: { type: 'file', data: string } | { type: 'buffer', data: Buffer },
  options: PrintOptions,
) {
  const resolvedOptions = resolveOptions(options);
  const bufferToBePrinted = await convertToLabelBuffer(
    convertToBlackAndWhiteMatrix(
      input.type === 'buffer' ? await parse(input.data) : await parseFile(input.data),
      resolvedOptions.blackwhiteThreshold,
    ),
    resolvedOptions.tapeWidth,
    resolvedOptions.highResolution,
  );

  const printer = ipp.Printer(printerUrl);
  const execute = util.promisify(printer.execute.bind(printer));

  console.log('Checking printer status...');
  const printerStatus = await execute('Get-Printer-Attributes', null);
  if (printerStatus['printer-attributes-tag']['printer-state'] !== 'idle') {
    throw new Error(`Printer ${printerStatus['printer-attributes-tag']['printer-name']} is not ready!`);
  } else {
    console.log('Printer is ready.');
  }

  const res = await execute(
    'Print-Job',
    {
      'operation-attributes-tag': {
        'requesting-user-name': 'mobile',
        'job-name': 'label',
        'document-format': 'application/octet-stream',
      },
      'job-attributes-tag': {
        copies: 1,
        sides: 'one-sided',
        'orientation-requested': 'landscape',
      },
      data: bufferToBePrinted,
    },
  );
  console.log('Print data sent.');

  if (res.statusCode === 'successful-ok'
    || res.statusCode === 'successful-ok-ignored-or-substituted-attributes') {
    console.log('Printing successful.');
    const jobId = res['job-attributes-tag']['job-id'];
    let tries = 0;
    let job;

    await wait(500);
    while (tries <= 50) {
      tries += 1;

      job = await execute(
        'Get-Job-Attributes',
        { 'operation-attributes-tag': { 'job-id': jobId } },
      );

      if (job && job['job-attributes-tag']['job-state'] === 'completed') {
        return job;
      }

      await wait(1000);
    }

    await execute('Cancel-Job', {
      'operation-attributes-tag': {
        'printer-uri': printer.uri, // or uncomment this two lines - one of variants should work!!!
        'job-id': job['job-attributes-tag']['job-id'],
      },
    });

    console.log(`Job with id ${job['job-attributes-tag']['job-id']}is being canceled`);
    throw new Error('Job is canceled - too many tries and job is not printed!');
  } else {
    console.log(res);
    throw new Error('Error sending job to printer!');
  }
}

export const printPngFile = async function (printerUrl: string, filename: string, options: PrintOptions = {}) {
  return print(printerUrl, { type: 'file', data: filename }, options);
};

export const printBuffer = async function (printerUrl: string, buffer: Buffer, options: PrintOptions = {}) {
  return print(printerUrl, { type: 'buffer', data: buffer }, options);
};
