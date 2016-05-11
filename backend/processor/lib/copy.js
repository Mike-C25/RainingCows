var _ = require('lodash');
var async = require('async');
var mysql = require('mysql');
var squel = require('squel');
var progress = require('progress');

var init = {};
var options = {};
var states = [];
var connection = null;

function insert(queries, callback) {
    // Process NOAA Data            
    async.forEachOfLimit(queries, 1, function(query, index, next) {

        // bar.tick(index);

        // Get Unique Station IDs
        var state_id = _.get(_.find(states, { Name: query['state'] }), 'ID');
        var stations = _.uniq(_.map(query['data_output']['results'], 'station'))

        var values = [];

        for (var i in stations) {
            values.push([stations[i], state_id]);
        }

        // Insert If Not Exist Station ID
        connection.query('INSERT IGNORE INTO Stations (ID, States_ID) VALUES ?', [values], function(err, results) {
            if (err) {
                return next(err);
            }

            var station_data = query['data_output']['results'];
            var values = _.map(station_data, function(d) {
                return [d['station'], d['value'], d['datatype'], d['attributes'], d['date']]; });

            connection.query('INSERT INTO Station_Data (Stations_ID, Value, DataType, Attributes, Date) VALUES ?', [values], function(err, results) {
                setTimeout(function() {
                    return next(err);
                }, 100);
            });
        });

        // async.forEachOfLimit();

    }, function(err) {
        return callback(err);
    })
}

function dynamoQuery() {

    var params = null;
    options.iscompleted = parseInt(options.iscompleted);

    if (options.state && options.year) {
        if (options.year == 'all') {
            params = {
                IndexName: 'state_year',
                KeyConditionExpression: '#s = :s and #y > :y',
                ExpressionAttributeNames: { '#s': 'state', '#y': 'year' },
                ExpressionAttributeValues: { ':s': options.state, ':y': 1900 }
            };
        } else {
            params = {
                IndexName: 'state_year',
                KeyConditionExpression: '#s = :s and #y = :y',
                ExpressionAttributeNames: { '#s': 'state', '#y': 'year' },
                ExpressionAttributeValues: { ':s': options.state, ':y': parseInt(options.year) }
            };
        }
    } else if (options.requestid) {
        params = {
            KeyConditionExpression: '#id = :id',
            ExpressionAttributeNames: { '#id': 'requestid' },
            ExpressionAttributeValues: { ':id': options.requestid }
        }
    } else if (options.iscompleted == 0 || options.iscompleted == 1) {
        params = {
            IndexName: 'incomplete',
            KeyConditionExpression: '#inc = :inc',
            ExpressionAttributeNames: { '#inc': 'is_completed' },
            ExpressionAttributeValues: { ':inc': options.iscompleted }
        }
    } else {
        throw new Error('Invalid query parameters');
    }

    params.TableName = 'noaa_data';

    var AWS = require('aws-sdk');
    var dynamodb = new AWS.DynamoDB();
    var dynamodbClient = new AWS.DynamoDB.DocumentClient();

    dynamodbClient.query(params, function(err, data) {
        if (err) {
            throw err;
        }

        var queries = data.Items;
        insert(queries, function(err) {
            if (err) {
                throw err;
            }
        })
    });
}

function stripType(obj) {
    if (obj['s']) {
        return obj['s'];
    } else if (obj['n']) {
        return parseInt(obj['n']);
    } else if (obj['m']) {
        var map = obj['m'];
        for (var m in map) {
            map[m] = stripType(map[m]);
        }
        return map;
    } else if (obj['l']) {
        var list = obj['l'];
        for (var l in list) {
            list[l] = stripType(list[l]);
        }
        return list;
    } else {
        return obj;
    }
}

function readFile() {

    var count = 1;
    var fs = require('fs');
    var readline = require('readline');
    var path = options.file;

    fs.access(path, fs.F_OK, function(err) {
        if (err) {
            throw err;
        }

        var rl = readline.createInterface({
            input: fs.createReadStream(path)
        });

        rl.on('line', (line) => {
            rl.pause();
            try {
                var query = JSON.parse(line);

                for (var i in query) {
                    query[i] = stripType(query[i]);
                }

                console.log(count + ': \t\t Processing ' + query['requestid']);

                count++;

                insert([query], function() {
                    rl.resume();
                })
            } catch (err) {
                console.error(err);
            }
        });
    });
}

    // var bar = new progress(' uploading [:bar] :percent :etas', { width: 50, total: queries.length, clear: true });

init.execute = function() {

    connection = mysql.createConnection(init.options['database']);

    connection.connect();

    connection.query(squel.select().from('States').toString(), function(err, results) {
        if (err) {
            return callback(err);
        }

        states = results;

        if (options.file) {
            readFile();
        } else {
            dynamoQuery();
        }
    });
}

exports = module.exports = function(opt) {
    options = init.options = opt;
    return init;
}