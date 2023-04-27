'use strict';

const path = require('path'),
    fs = require('fs'),
    os = require('os'),
    AWS = require('aws-sdk'),
    MongodbURI = require('mongodb-uri'),
    moment = require('moment'),
    PROJECT_ROOT = process
        .mainModule
        .paths[0]
        .split("node_modules")[0];

exports.BACKUP_PATH = (ZIP_NAME) => path.resolve(os.tmpdir(), ZIP_NAME);
exports.logFilePath = `${PROJECT_ROOT}/database/temp/backup.txt`;

exports.config = {
    // mongodb: `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT}/${process.env.DATABSE}`,
    mongodb: {
        "database": process.env.DATABSE,
        "host": process.env.HOST,
        "username": process.env.USERNAME,
        "password": process.env.PASSWORD,
        "port": process.env.PORT
    },
    s3: {
        accessKey: process.env.ACCESSKEY,  //AccessKey
        secretKey: process.env.SECRETKEY,  //SecretKey
        endpoint: process.env.ENDPOINT,     //S3 Bucket Region
        accessPerm: process.env.ACCESSPERM,
        bucketName: process.env.BUCKETNAME
    },
    keepLocalBackups: false, //If true, It'll create a folder in project root with database's name and store backups in it and if it's false, It'll use temporary directory of OS.
    noOfLocalBackups: 2, //This will only keep the most recent 5 backups and delete all older backups from local backup directory
    timezoneOffset: 300 //Timezone, Used in naming backups, It is assumed to be in hours if less than 16 and in minutes otherwise
};

// Checks provided Configuration, Rejects if important keys from config are
// missing
exports.ValidateConfig = (config) => {

    if (config && config.mongodb && config.s3 && config.s3.accessKey && config.s3.secretKey && config.s3.endpoint && config.s3.bucketName) {
        let mongodb;

        if (typeof config.mongodb == "string") {

            mongodb = MongodbURI.parse(config.mongodb);
        } else {

            if (config.mongodb.database && config.mongodb.host && config.mongodb.port) {

                mongodb = {
                    scheme: 'mongodb',
                    username: config.mongodb.username || null,
                    password: config.mongodb.password || null,
                    database: config.mongodb.database,
                    hosts: [{
                        host: config.mongodb.host,
                        port: config.mongodb.port
                    }]
                };
            }
            else if (config.mongodb.database && config.mongodb.hosts[0].host && config.mongodb.hosts[0].port) {

                mongodb = {
                    scheme: 'mongodb',
                    username: config.mongodb.username || null,
                    password: config.mongodb.password || null,
                    database: config.mongodb.database,
                    hosts: [{
                        host: config.mongodb.hosts[0].host,
                        port: config.mongodb.hosts[0].port
                    }]
                };
            }
            else {

                return false;
            }
        }
        if (config.keepLocalBackups) {
            fs.mkdir(path.resolve(PROJECT_ROOT, mongodb.database), err => {
                if (err) {
                    // Do nothing
                }
            });
            BACKUP_PATH = (ZIP_NAME) => path.resolve(PROJECT_ROOT, mongodb.database, ZIP_NAME);
        }

        // Replace Connection URI with parsed output from mongodb-uri
        config.mongodb = mongodb;
        console.log(config.mongodb);
        return true;
    }
    return false;
}

exports.AWSSetup = (config) => {

    AWS
        .config
        .update({
            accessKeyId: config.s3.accessKey,
            secretAccessKey: config.s3.secretKey,
            endpoint: config.s3.endpoint
        });

    return new AWS.S3();
}

// Gets current time If Timezoneoffset is provided, then it'll get time in that
// time zone If no timezone is provided, then it gives UTC Time
exports.currentTime = (timezoneOffset) => {
    if (timezoneOffset) {
        return moment(moment(moment.now()).utcOffset(timezoneOffset, true).toDate()).format("YYYY-MM-DDTHH-mm-ss");
    } else {
        return moment
            .utc()
            .format('YYYY-MM-DDTHH-mm-ss');
    }
}

exports.create_dir = () => {
    var dir = `./database/temp/`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
    return dir
}

exports.write_file = (filePath, resolved) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, `\n${JSON.stringify(resolved)}`, function (err) {
            if (err) throw err;
            console.log('It\'s saved!');
        });
    }
    else {
        fs.appendFile(filePath, `\n${JSON.stringify(resolved)}`, function (err) {
            if (err) throw err;
            console.log('It\'s saved!');
        });
    }
}

exports.read_file = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const objects = data.trim().split('\n').map(JSON.parse);
            const keys = objects.map(obj => {
                const newObj = { ...obj };
                newObj.key = obj.data.key;
                delete newObj.data;
                return JSON.stringify(newObj);
            });

            resolve(keys);
        })
    });
}

