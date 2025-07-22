const bwipjs = require('bwip-js');
const { printBuffer } = require('../dist/index.js');

async function createMicroQR(text) {
    return bwipjs.toBuffer({
        bcid: 'microqrcode',
        text: text,
        scale: 4,
    });
}

(async() => {
    const [ , , startArg, endArg ] = process.argv;
    if (!startArg) {
        console.error('Usage: node print-microqr-range.js <start> [end]');
        process.exit(1);
    }

    const start = parseInt(startArg, 10);
    const end = endArg ? parseInt(endArg, 10) : start;

    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
        console.error('Invalid range provided.');
        process.exit(1);
    }

    const printerUrl = 'http://192.168.178.71:631/ipp/print';
    const tapeWidth = 12;

    for (let i = start; i <= end; i += 1) {
        const qr = await createMicroQR(String(i));
        await printBuffer(printerUrl, qr, {
            tapeWidth,
            halfCut: true,
            highResolution: false,
        });
    }

    // Final full cut
    const blankPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAC0lEQVR42mP8/x8AAwMCAK+X8VQAAAAASUVORK5CYII=', 'base64');
    await printBuffer(printerUrl, blankPng, {
        tapeWidth,
        halfCut: false,
        highResolution: false,
    });
})();
