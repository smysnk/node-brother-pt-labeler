# brother-pt-labeler

A node.js library to print labels on a Brother label printer using the [Internet Printing Protocol (IPP)](https://en.wikipedia.org/wiki/Internet_Printing_Protocol).

 - Tested on Brother PT-P750W.
 - Although poorly written, [Brother's PT-E550W/P750W/P710BT Raster Command Reference documentation](https://download.brother.com/welcome/docp100064/cv_pte550wp750wp710bt_eng_raster_101.pdf) is useful for implementation details.

## How to print a PNG file
First, you will need the IP address of your printer. The port for IPP is usually `631` and the path is usually `/ipp/print`. Please refer to your printer's manual for further information. Next, you will need a PNG file to print. Currently, PNG is the only file format supported by this library.

```javascript
const { printPngFile } = require('brother-pt-labeler');
const printerUrl = 'http://192.168.178.71:631/ipp/print';
const tapeWidth = 12;

printPngFile(printerUrl, `./samples/name-tag-${ tapeWidth }mm.png`, { 
  tapeWidth,
  highResolution: false,  
});
```

See the [samples](https://github.com/smysnk/node-brother-pt-labeler/tree/master/samples) folder example png's.

## Considerations

Since this library is based on IPP it needs (raw, i.e. TCP) network access. This limitation implies that you cannot use this library in a web browser, where Javascript can only do HTTP/WebSocket requests. You can use this library on the server-side or in an [ElectronJS](https://www.electronjs.org/) desktop application.
