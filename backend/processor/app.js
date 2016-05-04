

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
    case 'noaaProcess':
        
        var noaa = require('./lib/noaa.js');
        noaa.process(argv, AWS);
        
        break;
        
    case 'quandlProcess':

        var quandl = require('./lib/quandl.js');
        quandl.process(argv, AWS);

        break;
    
    default:
        
        console.log('Avaiable commands: noaaProcess, quandlProcess');
}



