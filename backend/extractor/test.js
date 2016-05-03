
/*

//Quandl API Key
var qApiKey = "ZqWstC3utJ_y5ij3gExN";
//NOAA API Token
var wToken = "wxAttCfTwYnvVmjKlRyFuMcmoymfuxKi";

var locations = require('./locations.js');
            
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

function initWebServices(callback) {

    var accessKeyId = process.env.key;
    var secretAccessKey = process.env.secret;

    console.log('Loading Web Services: key:', accessKeyId, ' secret:', secretAccessKey);

    AWS.config.update({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: 'us-east-1'
    });

    return callback();
}

// weatherRequest();

var tableName = "noaa_data";

function initWeatherTable(callback) {

    var dynamodb = new AWS.DynamoDB();
    var dynamodbClient = new AWS.DynamoDB.DocumentClient();

    async.waterfall([
        function checkIfTableExists(next) {
            console.log("Checking If Table Exists");

            dynamodb.describeTable({
                TableName: tableName
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
                TableName: tableName,
                KeySchema: [{
                    AttributeName: "requestid",
                    KeyType: "HASH"
                }],
                AttributeDefinitions: [{
                        AttributeName: "year",
                        AttributeType: "N"
                    },
                    // { AttributeName: "month", AttributeType: "N" },
                    {
                        AttributeName: "requestid",
                        AttributeType: "S"
                    },
                    // { AttributeName: "region", AttributeType: "S" },
                    {
                        AttributeName: "state",
                        AttributeType: "S"
                    },
                    // { AttributeName: "data", AttributeType: "S" },
                    {
                        AttributeName: "is_completed",
                        AttributeType: "N"
                    }
                ],
                GlobalSecondaryIndexes: [{
                    IndexName: "state_year",
                    KeySchema: [{
                        AttributeName: "state",
                        KeyType: "HASH"
                    }, {
                        AttributeName: "year",
                        KeyType: "RANGE"
                    }],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                }, {
                    IndexName: "incomplete",
                    KeySchema: [{
                        AttributeName: "is_completed",
                        KeyType: "HASH"
                    }],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 5,
                        WriteCapacityUnits: 5
                    }
                }, ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 10,
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
                TableName: tableName
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
                                TableName: tableName,
                                Item: {
                                    "requestid": r + "_" + s + "_" + m + "_" + y,
                                    "region": r,
                                    "state": s,
                                    "month": m,
                                    "year": y,
                                    "is_completed": 0
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



async.waterfall([
    initWebServices,
    // initWeatherTable,
    // startWeatherRequest
], function() {

})





*/