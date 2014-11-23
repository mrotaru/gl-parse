var fs = require('fs');
var program = require('commander');
var path = require('path');
var _ = require('lodash');
var validator = require('validator');

program
  .version('0.0.1')
  .option('-v, --verbose', 'Verbose output')
  .option('-q, --quiet', 'Do not show any output')
  .parse(process.argv);

// debug and logging
if(!program.silent) {
    process.env.DEBUG='*';
}

var debug = require('debug');
var debugFiles = debug('files')
var debugParser = debug('parser')


var inputArg = program.args[0];
var inputs = [];
if(fs.lstatSync(inputArg).isFile()) {
    debugFiles('loading: ' + inputArg);
    inputs = fs.readFileSync(inputArg).toString().split("\n");
} else if(fs.lstatSync(inputArg).isDirectory()){
    // not supported yet
}

var events = [
    {
        type: "kill",
        regex: "^((?:[\\d]{2}:?){3})\\ -\\ ([^\\s]+)?\\s(?:<img=([\\w]+)>)\\s([^\\s]+)",
        properties: {
            "killer": "0",
            "icon"  : "1",
            "killed": "2"
        }
    },{
        type: "join",
        regex: "^((?:[\\d]{2}:?){3})\\ -\\ ([^\\s]+)\\ has\\ joined\\ the\\ game\\ with\\ ID:\\ ([\\d]+)",
        properties: {
            "playerName": "0",
            "id"  : "1"
        }
    },{
        type: "chat",
        regex: "^((?:[\\d]{2}:?){3})\\ -\\ (?:\\*DEAD\\*\\ )?\\[([^\\s]+)\\]\\ (.*)$",
        properties: {
            "playerName": "0",
            "message"  : "1"
        }
    }
];

var lineNumber = 0; // for debugging messages

var unparsedLines = 0; // lines that could not be parsed

/**
 * Iterate over each line in the log file
 */
_.each(inputs, function(line){
    
    line = validator.trim(line);
    if(!line.length) return; // ignore empty lines
    debugParser('processing: ' + line);
    lineNumber++;

    var done = false; // set to 'true' when a match is found

    /**
     * See if the line matches any one of the known event types. When a match is
     * found, quit trying the remaining ones. Matches are tried in the order they
     * are in the `events` array.
     */
    _.each(events, function(eventType){
        if(!done) {
            var re = new RegExp(eventType.regex);
            var matches = re.exec(line);
            if(matches){
                var event = {};
                event.type = eventType.type;
                event.timeStamp = matches[1];
                var properties = _.mapValues(eventType.properties, function(index){
                    return matches[parseInt(index)+2];
                });
                event.properties = properties;
                debugParser(event);
                done = true;
            }
        } else {
            return;
        }
    });

    /**
     * Line did not match any of the regular expressions, and therefore could not
     * be processed. These lines are written to a file.
     */
    if(!done) {
        debugParser('not processed.');
        unparsedLines++;
    }
});

debugParser(unparsedLines);
