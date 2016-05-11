var squel = require("squel");
var init = {}

init.execute = function() {
    var mysql = require('mysql');
    var connection = mysql.createConnection(this.options['database']);

    connection.connect();

    var regions = require('../data/locations.js')['REGIONS'];

    // Insert States
    var query = "INSERT INTO States (Name, Region) VALUES ?;";
    var values = [];

    for (var r in regions) {
        for (var s in regions[r]) {
            values.push([regions[r][s], r]);
        }
    }

    connection.query(query, [values], function(err, results) {
        if (err) {
            throw err;
        }
        
        console.log(results);

        connection.end();
    })
}

exports = module.exports = function(options) {
    init.options = options;
    return init;
}