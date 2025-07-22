const calls = [];

exports.calls = calls;
exports.Printer = () => ({
  execute(operation, args, callback) {
    calls.push({ operation, args });

    let result;
    if (operation === 'Get-Printer-Attributes') {
      result = { 'printer-attributes-tag': { 'printer-state': 'idle', 'printer-name': 'MockPrinter' } };
    } else if (operation === 'Print-Job') {
      result = { statusCode: 'successful-ok', 'job-attributes-tag': { 'job-id': 1 } };
    } else if (operation === 'Get-Job-Attributes') {
      result = { 'job-attributes-tag': { 'job-state': 'completed', 'job-id': 1 } };
    } else {
      result = null;
    }

    callback(null, result);
  },
});
