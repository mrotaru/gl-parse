var fs = require('fs');

exports = module.exports = function out(parsedEvents, logger, fileName) {
    var str = JSON.stringify(parsedEvents, null, 4);
    var fileName = fileName ? fileName + '.json' : 'events.json';
    if(logger && typeof logger === 'function') {
        logger('writing to: ' + fileName);
    }
    fs.writeFileSync(fileName, str);
}
