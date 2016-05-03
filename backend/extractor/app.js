/*

Example Usage:

node app.js --noaaKey rziyyZBpOQlVDGRGUdyluMmUrGkxjUFJ --cmd noaaRequest --state "Alaska" --year 2015 --overwrite true/false
node app.js --noaaKey wxAttCfTwYnvVmjKlRyFuMcmoymfuxKi --cmd noaaRequest --state "Alaska" --year 2015 --overwrite true/false
node app.js --noaaKey WPQZcmGKBQhwTnxjOMjXxTHfJdoBLDqE --cmd noaaRequest --state "Alaska" --year 2015 --overwrite true

node app.js --key asdf --secret fdsa --cmd setupTable --type noaa
node app.js --key asdf --secret fdsa --cmd setupTable --type commodity

node app.js --key asdf --secret fdsa --cmd noaaRequest --iscompleted true/false --noaaKey adsf
node app.js --key asdf --secret fdsa --cmd noaaRequest --state nj --year 2016
node app.js --key asdf --secret fdsa --cmd noaaRequest --request NorthEast_New_Jersey_01_2016

node app.js --key asdf --secret fdsa --cmd noaaRequestAdd --state nj --month 01 --year 2016

node app.js --key asdf --secret fdsa --cmd quandlRequest --symbol CME:GNF -year 2016
node app.js --key asdf --secret fdsa --cmd quandlRequest --symbol CME:GNF -year 2016

node app.js --key asdf --secret fdsa --cmd quandlRequestAdd --symbol CME:GNF -year 2017

*/

var AWS = require('aws-sdk');
var async = require("async");
var argv = require('minimist')(process.argv.slice(2));
// Get AWS credentials from env vars or arguments

// BASH = export AWS_KEY=

var accessKeyId = process.env.AWS_KEY || argv['aws-key'];
var secretAccessKey = process.env.AWS_SECRET || argv['aws-secret'];

if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS Key and Secret Required');
}

// Load AWS configurations

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: 'us-east-1'
});

// Execute Command

switch (argv.cmd) {
    case 'setupTable':
        
        var setup = require('./lib/setup.js');
        setup.init(argv, AWS);
        
        break;
        
    case 'noaaRequest':
    case 'noaaRequestAdd':

        var noaa = require('./lib/noaa.js');
        
        if (argv.cmd == 'noaaRequestAdd') {
            noaa.addRequest(argv);
        } else {
            noaa.request(argv);
        }

        break;
    
    case 'quandlRequest':
    case 'quandlRequestAdd':
        var comm = require('./lib/quandl.js');
        
        if(argv.cmd == 'quandlRequestAdd'){
            comm.addRequest(argv);
        } else{
            comm.request(argv);
        }
        
        break;
    
    default:
        
        console.log('Avaiable commands: setupTable, noaaRequest, quandlRequest');
}



// Quandl API
// API KEY: ZqWstC3utJ_y5ij3gExN
