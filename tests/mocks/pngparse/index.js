const files = [];

exports.files = files;

function parseFile(name, cb) {
  files.push(name);
  cb(null, { width: 1, height: 1, channels: 1, data: Uint8Array.from([0]) });
}

function parse(buffer, cb) {
  files.push('<buffer>');
  cb(null, { width: 1, height: 1, channels: 1, data: Uint8Array.from([0]) });
}

exports.parseFile = parseFile;
exports.parse = parse;
