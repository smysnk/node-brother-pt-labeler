const { printPngFile } = require('../dist/index.js');

(async() => {
    const printerUrl = 'http://192.168.178.71:631/ipp/print';
    const tapeWidth = 12;
    printPngFile(printerUrl, `./name-tag-${ tapeWidth }mm.png`, { 
        tapeWidth,
        highResolution: false,  
    });
})();