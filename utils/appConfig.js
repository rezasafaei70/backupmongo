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
// exports.logFilePath = `${PROJECT_ROOT}/database/temp/backup.txt`;

const config = exports.config = {
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
    timezoneOffset: 300, //Timezone, Used in naming backups, It is assumed to be in hours if less than 16 and in minutes otherwise

    deleteStorageBackups: process.env.DELETE_STORAGE_BACKUPS === 'true', //Enable or Disable
    daysAgoDeleteStorageBackups: process.env.DAYS_AGO_DELETE_STORAGE_BACKUPS  //Deleting backups of a few days ago on Storage
};

// Checks provided Configuration, Rejects if important keys from config are
// missing
exports.validateConfig = () => {

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
        create_dir();

        return true;
    }
    return false;
}

const AWSSetup = exports.AWSSetup = () => {

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

const create_dir = exports.create_dir = () => {
    var dir = `${PROJECT_ROOT}/database/temp/`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
    return dir
}

exports.write_file = (filePath, resolved) => {
    return new Promise((resolve, reject) => {

        //? If the file does not exist, a write operation will be performed for the new file,
        if (!fs.existsSync(filePath)) {
            fs.writeFile(filePath, `${JSON.stringify(resolved)}\n`, function (err) {
                if (err) {
                    return reject({
                        error: 1,
                        status: 'fail',
                        statusCode: 400,
                        message: err.message
                    });
                }
                console.log('It\'s saved!');
            });
        }
        //? and if the file exists, it will be added to file
        else {
            fs.appendFile(filePath, `${JSON.stringify(resolved)}\n`, function (err) {
                if (err) {
                    return reject({
                        error: 1,
                        status: 'fail',
                        statusCode: 400,
                        message: err.message
                    });
                }
                console.log('It\'s saved!');
            });
        }

        resolve({
            error: 0,
            status: 'success',
            message: 'file write operation was done successfully!'
        });
    });
}

exports.read_file = (filePath) => {
    return new Promise((resolve, reject) => {

        //? reading the lines of the log file to get the name of the uploaded files
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 400,
                    message: err.message
                });
            }

            const objects = data.trim().split('\n').map(JSON.parse);
            const keys = objects.map(obj => {
                const newObj = { ...obj };
                newObj.key = obj.data.key;
                delete newObj.data;
                return JSON.stringify(newObj);
            });

            resolve({
                error: 0,
                status: 'success',
                message: 'file read operation was done successfully!',
                data: { keys }
            });
        })
    });
}

exports.delete_fileRows = (filePath, keysToDelete) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 400,
                    message: err.message
                });
            }

            //? get objects
            const objects = data.trim();
            if (objects.length === 0) {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 404,
                    message: 'no file was found!'
                });
            }

            //? split the file contents into objects
            //? remove objects with keys in the keysToDelete array
            const filteredObjects = objects.split('\n').map(JSON.parse).filter(obj => !keysToDelete.includes(obj.data.Key));

            //? write the remaining objects back to the file
            fs.writeFile(filePath, filteredObjects.map(JSON.stringify).join('\n'), function (err) {
                if (err) {
                    return reject({
                        error: 1,
                        status: 'fail',
                        statusCode: 400,
                        message: err.message
                    });
                }

                resolve({
                    error: 0,
                    status: 'success',
                    message: 'file update operation was done successfully!'
                });
            });
        })
    });
}

exports.upload_file = (filePath) => {
    let s3 = AWSSetup(config);

    return new Promise((resolve, reject) => {
        let fileStream = fs.createReadStream(filePath);

        fileStream.on('error', err => {
            return reject({
                error: 1,
                status: 'fail',
                statusCode: 400,
                message: err.message
            });
        });

        let uploadParams = {
            Bucket: config.s3.bucketName,
            Key: filePath.split('/').pop(),
            Body: fileStream
        };

        s3.upload(uploadParams, (err, data) => {
            if (err) {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 400,
                    message: err.message,
                    code: err.code
                });
            }

            resolve({
                error: 0,
                status: 'success',
                message: 'file upload operation was done successfully!',
                data: data
            });

        });
    });
}
