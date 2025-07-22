// TODO: Remove this file when the packages '@sealsystems/ipp' and 'pngparse' are updated to include types.

declare module 'pngparse' {
  export type ParsedImageData = ImageData & { channels: 1 | 2 | 3 | 4 };

  export function parse(
    buffer: Buffer,
    callback: (err: Error | null, image: ParsedImageData) => void
  ): void;

  export function parseFile(
    filename: string,
    callback: (err: Error | null, image: ParsedImageData) => void
  ): void;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const _default: {
    parse: typeof parse;
    parseFile: typeof parseFile;
  };

  export default _default;
}

declare module '@sealsystems/ipp' {
  const ipp: any;
  export default ipp;
}