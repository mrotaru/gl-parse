var _   = require('lodash');

var players = [];

exports = module.exports = function out(parsedEvents, logger, cliOptions) {
    _.each(parsedEvents, function(event){
        switch(event.type){
            case 'kill':
                if(event.properties.killer !== 'undefined') {
                    var killer = _.find(players, function(player){
                        return player.name === event.properties.killer;
                    });

                    if(!killer) {
                        players.push({name: event.properties.killer, kills: 1});
                    } else {
                        if(killer.kills) {
                            killer.kills++;
                        } else {
                            killer.kills=1;
                        }
                    }

                    var killed = _.find(players, function(player){
                        return player.name === event.properties.killed;
                    });

                    if(!killed) {
                        players.push({name: event.properties.killed, deaths: 1});
                    } else {
                        if(killed.deaths) {
                            killed.deaths++;
                        } else {
                            killed.deaths=1;
                        }
                    }
                }
                break;
            case 'chat':
                break;
            case 'join':
                break;
            default:
                logger('unknown event type: ' + event.type);
        }

    });
    console.log(players);
}
