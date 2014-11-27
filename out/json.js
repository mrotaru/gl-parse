var fs = require('fs');

exports = module.exports = function out(parsedEvents, logger, config) {
    var str = JSON.stringify(parsedEvents, null, 4);
    var fileName = config.outFileNameBase ? config.outFileNameBase + '-events.json' : 'events.json';
    if(logger && typeof logger === 'function') {
        logger('writing to: ' + fileName);
    }
    fs.writeFileSync(fileName, str);
}
