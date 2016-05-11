var express = require('express');
var router = express.Router();

var _ = require('lodash');
var async = require('async');
var mysql = require('mysql');
var squel = require('squel');

var conn = null;

function checkConnection(callback) {
	if (!conn) {
		var connParams = null;

		if (process.env.SQL_CONN_STRING) {
			params = JSON.parse(process.env.SQL_CONN_STRING);
		} else {
			params = { 
				"host": process.env.SQL_HOST,
				"user": process.env.SQL_USER,
				"password": process.env.SQL_PASSWORD,
				"database": process.env.SQL_DATABASE
			};
		}

	    conn = mysql.createConnection(params);

	    conn.connect(function(err) {
	    	return callback(err);
	    });

	    conn.on('error', function(err) {
	    	console.error(err);
	    	conn = null;
		});
	} else {
		return callback();
	}
}

/* 

GET /api/weather?preset=us|conus|ne|w
GET /api/weather?states=nj,ny,pa

*/

router.get('/weather', function(req, res, next) {

	if (!req.query.preset && !req.query.states) {
		return res.json({
			success: false,			
			error: 'Invalid request',
			message: 'Invalid request'
		});
	}

	var baseQuery = squel.select()
						 .from('Station_Data')
						 .field('YEAR(Date)', 'year')
						 .field('MONTH(Date)', 'month')
						 .field('AVG(CASE WHEN (DataType = "MMNT") THEN Value ELSE NULL END)', 'mmnt')
						 .field('AVG(CASE WHEN (DataType = "MMXT") THEN Value ELSE NULL END)', 'mmxt')
						 .field('AVG(CASE WHEN (DataType = "MNTM") THEN Value ELSE NULL END)', 'mntm')
						 .group('YEAR(Date)')
						 .group('MONTH(Date)')

    var stationQuery = squel.select()
    						.from('Stations')
    						.field('Stations.ID')
    						.join('States', null, 'States.ID = Stations.States_ID')

	if (req.query.preset) {

		var preset = String(req.query.preset).toLowerCase();

		switch (preset) {
			case 'us':
				break;
			case 'conus':
				stationQuery.where(
					squel.expr()
						 .or('States.NameAbbr = "ak"')
						 .or('States.NameAbbr = "hi"')
				);

				baseQuery.where('Stations_ID NOT IN ?', stationQuery);
				break;
			case 'ne':
			case 'ma':
			case 's':
			case 'mw':
			case 'sw':
			case 'w':
				stationQuery.where('States.RegionAbbr = ?', preset);
				baseQuery.where('Stations_ID IN ?', stationQuery);
				break;
		}
	} else if (req.query.states) {

		var states = String(req.query.states).split(',');

		stationQuery.where('States.NameAbbr IN ?', states);
		baseQuery.where('Stations_ID IN ?', stationQuery);

	}

	checkConnection(function(err) {
		if (err) {
			return res.json({ 
				error: err,
				success: false, 
				message: 'Database connection error.'
			});
		}

		conn.query(baseQuery.toString(), function(err, result) {
			if (err) {
				return res.json({ 
					error: err,
					success: false, 
					message: 'Query invalid.',
				});
			}

			return res.json({
				success: true,
				data: result
			});
		});
	});
});

module.exports = router;