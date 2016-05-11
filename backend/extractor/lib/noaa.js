//Dependencies
var AWS = require('aws-sdk');
var request = require('request');
var moment = require('moment');
var async = require('async');
var locations = require('../locations.js');

//EXPERIMENTAL TABLE
// var tableName = 'request_weather';

var tableName = 'noaa_data';
var noaaKey = null;

var dynamodb = new AWS.DynamoDB();
var dynamodbClient = new AWS.DynamoDB.DocumentClient();


// REQUEST FOR MNTM/MMXT / MMNT  http://www.ncdc.noaa.gov/cdo-web/api/v2/data?datasetid=GHCNDMS&datatypeid=MNTM&datatypeid=MMXT&datatypeid=MMNT&locationid=FIPS:48&startdate=2010-05-01&enddate=2010-05-31&limit=1000&offset=1000
// MNTM - MEAN TEMP/ value == tenth of degrees / value = (value * .1)

// token 1 - WPQZcmGKBQhwTnxjOMjXxTHfJdoBLDqE
// token 2 - wxAttCfTwYnvVmjKlRyFuMcmoymfuxKi
// token 3 - rziyyZBpOQlVDGRGUdyluMmUrGkxjUFJ

// Export

var noaa = {};

noaa.request = function(options) {

    noaaKey = process.env.NOAA_KEY || options.noaaKey;
    
    if (!noaaKey) {
        throw new Error('NOAA API Key Required');
    }

    // var dynamodb = new AWS.DynamoDB();
    // var dynamodbClient = new AWS.DynamoDB.DocumentClient();

    var params = null;

    if (options.state && options.year) {
        if (options.year == 'all') {
            params = {
                TableName: tableName,
                IndexName: 'state_year',
                KeyConditionExpression: '#s = :s and #y > :y',
                ExpressionAttributeNames: {
                    '#s': 'state',
                    '#y': 'year'
                },
                ExpressionAttributeValues: {
                    ':s': options.state,
                    ':y': 1900
                }
            };
        } else {
            params = {
                TableName: tableName,
                IndexName: 'state_year',
                KeyConditionExpression: '#s = :s and #y = :y',
                ExpressionAttributeNames: {
                    '#s': 'state',
                    '#y': 'year'
                },
                ExpressionAttributeValues: {
                    ':s': options.state,
                    ':y': options.year
                }
            };
        }
    } else if (options.requestid) {
        params = {
            TableName: tableName,
            KeyConditionExpression: '#id = :id',
            ExpressionAttributeNames: {
                '#id': 'requestid'
            },
            ExpressionAttributeValues: {
                ':id': options.requestid
            }
        }
    } else if (options.is_completed == 0 || options.is_completed == 1) {
         params = {
            TableName: tableName,
            IndexName: 'incomplete',
            KeyConditionExpression: '#inc = :inc',
            ExpressionAttributeNames: {
                '#inc': 'is_completed'
            },
            ExpressionAttributeValues: {
                ':inc': options.is_completed
            }
        }
    }
    dynamodbClient.query(params, function(err, data) {
        if (err) {
            throw err;
        }

        var queries = [];

        console.log('Query succeeded. ' + data.Items.length + ' queries found.');
        
        if (!options.overwrite) {
            
            for (var i=0; i<data.Items.length; i++) {
                if (data.Items[i].is_completed == 0) {
                    queries.push(data.Items[i]);
                }
            }
            
            console.log('Processing ' + queries.length + ' incomplte queries.');
        } else {
            queries = data.Items;
        }

        return executeNoaaQuery(queries, function(err) {
            throw err;
        });
    });
}

exports = module.exports = noaa;

// Internal Functions

function generateUrl(query, offset) {

    var url = 'http://www.ncdc.noaa.gov/cdo-web/api/v2/data?';

    var startDate = moment([query.year, query.month - 1]);
    var endDate = moment(startDate).endOf('month');

    url += 'datasetid=GHCNDMS&';
    url += 'datatypeid=MNTM&datatypeid=MMXT&datatypeid=MMNT&';
    url += 'locationid=' + query.noaaID + '&';
    url += 'startdate=' + startDate.format('YYYY-MM-DD') + '&';
    url += 'enddate=' + endDate.format('YYYY-MM-DD') + '&';
    url += 'limit=1000&'
    url += 'offset=' + offset;

    return url;
}

function makeNoaaRequest(url, callback) {

    var options = {
        url: url,
        headers: {
            'token': noaaKey
        }
    };

    request(options, function(err, response, body) {

        var data = JSON.parse(body);
        var metadata = data.metadata.resultset;
        var result = data.results;
        
        return callback(err, data, metadata);
    })
}

function saveDataToDynamoDB(query, data, callback) {

    var params = {
        TableName: tableName,
        Key: {
            'requestid': query.requestid
        },
        UpdateExpression: 'set data_output = :d, is_completed = :c',
        ExpressionAttributeValues: {
            ':d': data,
            ':c': 1
        },
        ReturnValues: 'ALL_NEW'
    };

    dynamodbClient.update(params, function(err, data) {
        if (err) {
            console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
            throw err;
        }

        // To prevent surpassing NOAA request limit 5 per second
        setTimeout(function() {
            return callback();
        }, 1000);
    });
}

function requestHandler(query, next, prepend) {
    return function(err, data, metadata) {

        if (err) {
            console.error('Handling response', err)
            return next(err);
        }
        
        if (prepend) {
            for (var i=0; i<data.results.length; i++) {
                prepend.results.push(data.results[i]);
            }
        }

        if (metadata.count >= metadata.offset + metadata.limit) {

            var offset = metadata.offset + metadata.limit;
            var forwardData = prepend ? prepend : data;

            console.log('Requesting NOAA data for : ' + query.requestid + ' (' + offset + ')');
            makeNoaaRequest(generateUrl(query, offset), requestHandler(query, next, forwardData));
            
        } else {
            
            var finalData = prepend ? prepend : data;
            
            console.log('Saving ' + finalData.results.length + ' weather station records.');
            
            saveDataToDynamoDB(query, data, function(err) {
    
                if (err) {
                    console.error('Error saving to DynamoDB', err)
                    throw err;
                }
    
                return next();
            })
        }
    }
}

function executeNoaaQuery(queries, callback) {

    var noaaIDs = locations.NOAA_ID;

    async.forEachOfSeries(queries, function(query, index, next) {

        var noaaID = null;
        for (var i = 0; i < noaaIDs.length; i++) {
            if (noaaIDs[i].name == query.state) {
                noaaID = noaaIDs[i].id;
                break;
            }
        }

        if (noaaID == null) {
            console.error('Can\'t find NOAA State ID', query);
            return next();
        }
        
        query.noaaID = noaaID;

        console.log('Requesting NOAA data for : ' + query.requestid);
    
        makeNoaaRequest(generateUrl(query, 1), requestHandler(query, next));

    }, function(err) {
        if (err) {
            throw err;
        }
    })
}

