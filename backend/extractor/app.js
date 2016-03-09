//Dependencies
var nmailer = require('nodemailer');
var AWS = require('aws-sdk');
var nschedule = require('node-schedule');
var request = require('request');
var fs = require('fs');
var async = require("async");

AWS.config.update({
    accessKeyId: 'AKIAJSBLJBHVQLVDEJWA',
    secretAccessKey: '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',
    region: 'us-east-1'
});

//Quandl API Key
var qApiKey = "ZqWstC3utJ_y5ij3gExN";
//NOAA API Token
var wToken = "wxAttCfTwYnvVmjKlRyFuMcmoymfuxKi";

// Access Key ID:
// AKIAJSBLJBHVQLVDEJWA
// Secret Access Key:
// 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


function weatherRequest() {
    var options = {
        url: 'http://www.ncdc.noaa.gov/cdo-web/api/v2/locations?locationcategoryid=ST&limit=52',
        headers: {
            'token': 'wxAttCfTwYnvVmjKlRyFuMcmoymfuxKi'
        }
    };

    function callback(error, response, body) {
        if (error) {
            console.error("Request Failed", error);
        }
        else {
            var data = JSON.parse(body);
            console.log(data);

        }
    }

    request(options, callback);
}

// weatherRequest();

function initWeatherTable(callback) {

    var dynamodb = new AWS.DynamoDB();
    var dynamodbClient = new AWS.DynamoDB.DocumentClient();

    async.waterfall([
        function checkIfTableExists(next) {
            console.log("Checking If Table Exists");

            dynamodb.describeTable({
                TableName: "weather"
            }, function(err, table) {
                return next(null, table);
            });
        },
        function createTableIfNonexistant(table, next) {
            console.log("Create Table If Not Exists");

            if (table) {
                return next(null, table);
            }

            var params = {
                TableName: "request_weather",
                KeySchema: [{
                    AttributeName: "requestid",
                    KeyType: "HASH"
                }],
                AttributeDefinitions: [{
                    AttributeName: "requestid",
                    AttributeType: "S"
                }],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 1,
                    WriteCapacityUnits: 10
                }
            };

            dynamodb.createTable(params, function(err, table) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
                }
                else {
                    console.log("Created table. Table description JSON:", JSON.stringify(table, null, 2));
                }
                next(err, table);
            });
        },
        function waitForTableActive(table, next) {
            console.log("Wait for active table");

            dynamodb.waitFor('tableExists', {
                TableName: "request_weather"
            }, function(err, data) {
                console.log(err);
                return next();
            })
        },
        function initializeTableData(next) {
            console.log("Insert table data");

            var regions = {
                "New England": [
                    "Connecticut",
                    "Maine",
                    "Massachusetts",
                    "New Hampshire",
                    "Rhode Island",
                    "Vermont"
                ],
                "Mid Atlantic": [
                    "Delaware",
                    "Maryland",
                    "New Jersey",
                    "New York",
                    "Pennsylvania"
                ],
                "South": [
                    "Alabama",
                    "Arkansas",
                    "Florida",
                    "Georgia",
                    "Kentucky",
                    "Louisiana",
                    "Mississippi",
                    "Missouri",
                    "North Carolina",
                    "South Carolina",
                    "Tennessee",
                    "Virginia",
                    "West Virginia"
                ],
                "Midwest": [
                    "Illinois",
                    "Indiana",
                    "Iowa",
                    "Kansas",
                    "Michigan",
                    "Minnesota",
                    "Nebraska",
                    "North Dakota",
                    "Ohio",
                    "South Dakota",
                    "Wisconsin"
                ],
                "Southwest": [
                    "Arizona",
                    "New Mexico",
                    "Oklahoma",
                    "Texas"
                ],
                "West": [
                    "Alaska",
                    "California",
                    "Colorado",
                    "Hawaii",
                    "Idaho",
                    "Montana",
                    "Nevada",
                    "Oregon",
                    "Utah",
                    "Washington",
                    "Wyoming"

                ]
            }
            var states = ["Alabama", "Arizona", "Arkansas", "California", "Colorado", "Conneticut", "Delaware", "Florida", "Georgia", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusets", "Michigan", "Minnisota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "Sourth Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconson", "Wyoming"];

            var requests = [];

            // Populate the table with state_month_year
            for (var r in regions) {
                for (var i in regions[r]) {
                    var s = regions[r][i];
                    for (var y = 1992; y < 2016; y++) {
                        for (var m = 1; m <= 12; m++) {
                            requests.push({
                                TableName: "request_weather",
                                Item: {
                                    "requestid": r + "_" + s + "_" + m + "_" + y,
                                    "region": r,
                                    "state": s,
                                    "month": m,
                                    "year": y,
                                    "is_completed": false
                                }
                            })
                        }
                    }
                }
            }

            async.forEachOfSeries(requests, function(item, index, next) {
                // Insert this row, into the table
                dynamodbClient.put(item, function(err, data) {
                    console.log(index + ' Item Put: ', data, err);
                    setTimeout(function() {
                        next();
                    }, 10);
                })
            }, function() {
                next();
            });
        }
    ], function(err) {
        if (err) console.error(err);
        callback();
    });
}

function startWeatherRequest(callback) {
    async.waterfall([
            function getIncompleteRequests() {
                var options = {
                    url: 'http://www.ncdc.noaa.gov/cdo-web/api/v2/locations?locationcategoryid=ST&limit=52',
                    headers: {
                        'token': 'wxAttCfTwYnvVmjKlRyFuMcmoymfuxKi'
                    }
                };

                function callback(error, response, body) {
                    if (error) {
                        console.error("Request Failed", error);
                    }
                    else {
                        var data = JSON.parse(body);
                        console.log(data);

                    }
                }

                request(options, callback);
            },
            function makeRequests() {

            }

        ],
        function(err) {
            callback();
        })
}

async.waterfall([
    initWeatherTable,
    startWeatherRequest
], function() {

})


// initWeatherDB(function() {
//     // startWeatherRequest();
//     console.log("All done");
// });
// var docClient = new AWS.DynamoDB.DocumentClient();

// console.log("Importing movies into DynamoDB. Please wait.");

// var allMovies = JSON.parse(fs.readFileSync('moviedata.json', 'utf8'));
// allMovies.forEach(function(movie) {
//     var params = {
//         TableName: "Movies",
//         Item: {
//             "year":  movie.year,
//             "title": movie.title,
//             "info":  movie.info
//         }
//     };

//     docClient.put(params, function(err, data) {
//       if (err) {
//           console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
//       } else {
//           console.log("PutItem succeeded:", movie.title);
//       }
//     });
// });