var fs = require('fs');
var program = require('commander');
var path = require('path');
var _ = require('lodash');

program
  .version('0.0.1')
  .option('-v, --verbose', 'Verbose output')
  .parse(process.argv);

var inputArg = program.args[0];
var inputs = [];
if(fs.lstatSync(inputArg).isFile()) {
    inputs = fs.readFileSync(inputArg).toString().split("\n");
} else if(fs.lstatSync(inputArg).isDirectory()){
    // not supported yet
}

var events = [
    {
        type: "kill",
        regex: "^((?:[\d]{2}:?){3})\ -\ ([^\s]+)?\s(?:<img=([\w]+)>)\s([^\s]+)",
        properties: {
            "killer": "0",
            "icon"  : "1",
            "killed": "2"
        }
    },{
        type: "chat",
        regex: ""
    },{
        type: "join",
        regex: ""
    }
];

/**
 * Iterate over each line in the log file
 */
_.each(inputs, function(line){

    /**
     * Set to 'true' when a match is found
     */
    var done = false;

    /**
     * See if the line matches any one of the known event types. When a match is
     * found, quit trying the remaining ones. Matches are tried in the order they
     * are in the `events` array.
     */
    _.each(events, function(eventType){
        if(!done) {
            var re = new RegExp(eventType.regex);
            var matches = re.exec(line);
            if(match){
                var event = {};
                event.type = eventType.type;
                var properties = _.mapValues(eventType.properties, function(index){
                    return match[index];
                });
                done = true;
            }
        }
    });
});
