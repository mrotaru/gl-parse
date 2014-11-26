var lineFormats = [
    {
        type: "kill",
        regex: "^((?:[\\d]{2}:?){3})\\ -\\ ([^\\s]+)?\\s(?:<img=([\\w]+)>)\\s([^\\s]+)",
        properties: {
            "timeStamp": "1",
            "killer": "2",
            "icon"  : "3",
            "killed": "4"
        }
    },{
        type: "join",
        regex: "^((?:[\\d]{2}:?){3})\\ -\\ ([^\\s]+)\\ has\\ joined\\ the\\ game\\ with\\ ID:\\ ([\\d]+)",
        properties: {
            "timeStamp": "1",
            "playerName": "2",
            "id"  : "3"
        }
    },{
        type: "chat",
        regex: "^((?:[\\d]{2}:?){3})\\ -\\ (?:\\*DEAD\\*\\ )?\\[([^\\s]+)\\]\\ (.*)$",
        properties: {
            "timeStamp": "1",
            "playerName": "2",
            "message"  : "3"
        }
    }
];

exports = module.exports = lineFormats;
