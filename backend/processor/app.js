#!/usr/bin/env node

var program = require('commander');

program
	// .arguments('<file>')
	.option('-k, --aws-key <key>', 'AWS Access Key')
	.option('-s, --aws-secret <secret>', 'AWS Access Secret')
	.option('-c, --command <command>', 'Command to execute (init, copy)')
	.option('--database <database>', 'MySQL Database Configuration { host: localhost, user: root, password: pwd, database: mydb }')
    .option('--file <file>', 'JSON Data File')
	.option('--state <state>', 'Filter query by state ("New Jersey")')
	.option('--year <year>', 'Filter query by year (2010 | all)')
    .option('--requestid <requestid>', 'Select a single request')
    .option('--iscompleted <iscompleted>', 'Select completed requests')
    .option('--overwrite <overwrite>', 'Overwrite existing data')
	.parse(process.argv);

var options = program;

options['awsKey'] = options['awsKey'] || process.env.AWS_KEY;
options['awsSecret'] = options['awsSecret'] || process.env.AWS_SECRET;
options['database'] = (options['database'] ? JSON.parse(options['database']) : null);

if (!options['awsKey'] || !options['awsSecret']) {
	throw new Error('AWS Key and Secret Required');
}

if (!options['database']) {
	throw new Error('MySQL Database Configuration Required');
}

var AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: options['awsKey'],
    secretAccessKey: options['awsSecret'],
    region: 'us-east-1'
});

switch(options['command']) {
	case 'init': 

		var lib = require('./lib/init.js')(options);
		lib.execute();

		break;
	case 'copy':

		var lib = require('./lib/copy.js')(options);
		lib.execute();

		break;
}