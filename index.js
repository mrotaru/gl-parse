var fs = require('fs');
var program = require('commander');
var path = require('path');
var _ = require('lodash');
var validator = require('validator');
var glob = require('glob');

program
  .version('0.0.1')
  .option('-q, --quiet', 'Do not show any output')
  .option('-s, --save-unparsed', 'Store unparsed lines in unparsed.json')
  .option('-v, --verbose', 'Show each parsed line on command line')
  .option('-i, --input-format [value]', 'JavaScript file describing log format', 'mnb')
  .option('-o, --out [value]', 'Which js to load for processing parsed events', 'json')
  .option('-f, --out-file-name [value]', 'File name which will store processed events, without extension', 'events')
  .option('-t, --types <list>', 'Which types to skip when processing.', list)
  .parse(process.argv);

/*
 * Split at comma
 */
function list(val) {
  return val.split(',');
}

/*
 * Load config.json if exists
 */
var config = null;
if(fs.existsSync('./config.json') && fs.lstatSync('./config.json').isFile()){
    config = require('./config.json');
}

/*
 * Setup debugging and logging
 */
if(!program.quiet) {
    process.env.DEBUG='*';
}
var debug = require('debug');
var debugParser = debug('parser');
var debugParserWarn = debug('parser:warn');
var debugOut = debug('out');
var debugFiles = debug('files');

/*
 * Load input format - a json file with regexes which describe the log format
 */
var eventTypes = null;
if(fs.lstatSync(program.inputFormat)){
    debugFiles('loading log format description from: ' + program.inputFormat);
    eventTypes = require('./' + program.inputFormat);
} else {
    debugFiles('No input. Exiting.');
    process.exit();
}

/*
 * From command line options, see which log file to process
 */
var inputArg = program.args[0];
var inputFiles = [];
if(fs.lstatSync(inputArg).isFile()) {
    debugParser('loading log file: ' + inputArg);
    inputFiles.push(inputArg);
} else if(fs.lstatSync(inputArg).isDirectory()){
    debugParser('searching *.log and *.txt files in: ' + inputArg);
    var globPattern = inputArg + '*.{txt,log}';
    var inputFiles = glob.sync(globPattern);
    debugParser('found ' + inputFiles.length + ' log files.');
}

_.each(inputFiles, function(fileName) {

debugFiles('processing: ' + fileName);

var state = {};
var inputs = fs.readFileSync('./' + fileName).toString().split("\n");

inputs = _.map(inputs,function(line){
    return validator.trim(line);
});

inputs = _.filter(inputs,function(line){
    return line.length > 0;
});

state.lineNumber = 0; // for debugging messages
state.unparsedLines = []; // lines that could not be parsed
state.skippedLines = []; // filtered with --type
var parsedEvents = []; // for storing each parsed event

/**
 * Iterate over each line in the log file
 */
_.each(inputs, function(line){
    
    if(!line.length) return; // ignore empty lines
    if(program.verbose) { debugParser('processing: ' + line); }
    state.lineNumber++;

    var done = false; // set to 'true' when a match is found

    /**
     * See if the line matches any one of the known event types. When a match is
     * found, quit trying the remaining ones. Matches are tried in the order they
     * are in the `eventTypes` array.
     */
    _.each(eventTypes, function(eventType){
        if(!done) {
            var re = new RegExp(eventType.regex);
            var matches = re.exec(line);
            if(matches){
                var event = {};
                event.type = eventType.type;

                /**
                 * If --types are specified, then ignore those.
                 */
                if(program.types && _.contains(program.types, event.type)){
                    debugParserWarn('skipping (filtered): ' + line );
                    state.skippedLines.push(line);
                    done = true;
                    return false;
                } 
                var properties = _.mapValues(eventType.properties, function(index){
                    return matches[index];
                });
                event.properties = properties;
                if(program.verbose) { debugParser(event); }
                parsedEvents.push(event);
                done = true;
            }
        } else {
            return;
        }
    });

    /**
     * Line did not match any of the regular expressions, and therefore could
     * not be processed. Store all unprocessed lines in an array to be flushed
     * to a file later.
     */
    if(!done) {
        debugParser('not processed.');
        state.unparsedLines.push(line);
    }
});

/**
 * Show some stats - processed lines, skipped etc
 */
debugParser('lines in ' + fileName + ' - excluding blanks: ' + inputs.length);
debugParser('unparsed: ' + state.unparsedLines.length);
debugParser('skipped: ' + state.skippedLines.length);

/**
 * If output is specified, pass extracted events to output function.
 */
var outJs = './out/' + program.out + '.js';
if(fs.lstatSync(outJs)){
    outFunction = require(outJs);
    try {
        debugFiles('passing ' + parsedEvents.length + ' event to ' + outJs);
        outFunction(parsedEvents, debugOut, program);
    } catch(e) {
        console.log('Error: ', e);
    }
} else {
    debugFiles('No input. Exiting.');
    process.exit();
}

/**
 * Write unparsed lines to file, if --save-unparsed
 */
if(program.saveUnparsed) {
    var unparsedLinesFile = 'unparsed.txt';
    debugFiles('Writing ' + state.unparsedLines.length + ' lines to ' + unparsedLinesFile);
    fs.writeFileSync(unparsedLinesFile);
}
});
