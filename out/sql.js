var fs  = require('fs');
var _   = require('lodash');

/**
 * Escape a value to prevent SQL injection
 * From: https://github.com/felixge/node-mysql/blob/master/lib/protocol/SqlString.js#L16
 */
function escape(val){
    if(typeof val === 'undefined') {
        return 'NULL'
    };
    val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
        switch(s) {
            case "\0": return "\\0";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\b": return "\\b";
            case "\t": return "\\t";
            case "\x1a": return "\\Z";
            default: return "\\"+s;
        }
    });
    return "'"+val+"'";
}

function capitalize(str){
    return str.charAt(0).toUpperCase() + str.slice(1); 
}

function eventTableName(event){
    return capitalize(event.type) + 'Events';
}

exports = module.exports = function out(parsedEvents, logger, fileName) {
    var str = '';

    _.each(parsedEvents, function(event){
        var line = '';
        line += 'INSERT INTO ' + eventTableName(event) + ' VALUES ( ';
        _.forIn(event.properties, function(value, key){
            try {
                line += escape(value) + ',';
            } catch(e){
                logger('error when processing ', event, ':\n', e);
            }
        });
        line = line.replace(/,\s*$/, "");
        line += ' );\n';
        logger(line.replace(/\n$/,""));
        str += line;
    });

    var fileName = fileName ? fileName + '.sql' : 'events.sql';
    if(logger && typeof logger === 'function') {
        logger('writing to: ' + fileName);
    }
    fs.writeFileSync(fileName, str);
}
