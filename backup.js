'use strict';

const path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec;

const {config,BACKUP_PATH, AWSSetup, ValidateConfig ,currentTime} = require('./utils/appConfig');


function BackupMongoDatabase(config) {

    // Backups are stored in .tmp directory in Project root
    fs.mkdir(path.resolve(".tmp"), (err) => {
        if (err && err.code != "EEXIST") {
            return Promise.reject(err);
        }
    });

    return new Promise((resolve, reject) => {

        const database = config.mongodb.database,
            password = config.mongodb.password || null,
            username = config.mongodb.username || null,
            timezoneOffset = config.timezoneOffset || null,
            host = config.mongodb.hosts[0].host || null,
            port = config.mongodb.hosts[0].port || null;

        let DB_BACKUP_NAME = `${database}_${currentTime(timezoneOffset)}.gz`;

        // Default command, does not considers username or password
        let command = `mongodump -h ${host} --port=${port} -d ${database} --gzip --archive=${BACKUP_PATH(DB_BACKUP_NAME)}`;

        // When Username and password is provided
        if (username && password) {
            command = `mongodump -h ${host} --port=${port} -d ${database} -p ${password} -u ${username} --authenticationDatabase admin --gzip --archive=${BACKUP_PATH(DB_BACKUP_NAME)}`;
        }
        // When Username is provided
        if (username && !password) {
            command = `mongodump -h ${host} --port=${port} -d ${database} -u ${username} --gzip --archive=${BACKUP_PATH(DB_BACKUP_NAME)}`;
        }

        exec(command, (err, stdout, stderr) => {
            if (err) {
                // Most likely, mongodump isn't installed or isn't accessible
                reject({
                    error: 1,
                    message: err.message
                });
            } else {
                resolve({
                    error: 0,
                    message: "Successfuly Created Backup",
                    backupName: DB_BACKUP_NAME
                });
            }
        });
    });
}

function DeleteLocalBackup(ZIP_NAME) {

    return new Promise((resolve, reject) => {
        fs.unlink(BACKUP_PATH(ZIP_NAME), (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({
                    error: 0,
                    message: "Deleted Local backup",
                    zipName: ZIP_NAME
                });
            }
        });
    });
}

// S3 Utils Used to check if provided bucket exists If it does not exists then
// it can create one, and then use it.  Also used to upload File
function CreateBucket(S3, config) {

    const bucketName = config.s3.bucketName,
        accessPerm = config.s3.accessPerm,
        region = config.s3.region;

    return new Promise((resolve, reject) => {
        S3.createBucket({
            Bucket: bucketName,
            ACL: accessPerm || "private",
            CreateBucketConfiguration: {
                LocationConstraint: region
            }
        }, (err, data) => {
            if (err) {
                reject({
                    error: 1,
                    message: err.message,
                    code: err.code
                });
            } else {
                resolve({
                    error: 0,
                    url: data.Location,
                    message: 'Sucessfully created Bucket'
                });
            }
        });
    });
}

function UploadFileToS3(S3, ZIP_NAME, config) {
    return new Promise((resolve, reject) => {
        let fileStream = fs.createReadStream(BACKUP_PATH(ZIP_NAME));

        fileStream.on('error', err => {
            return reject({
                error: 1,
                message: err.message
            });
        });

        let uploadParams = {
            Bucket: config.s3.bucketName,
            Key: ZIP_NAME,
            Body: fileStream
        };

        S3.upload(uploadParams, (err, data) => {
            if (err) {
                return reject({
                    error: 1,
                    message: err.message,
                    code: err.code
                });
            }

            if (!config.keepLocalBackups) {
                //  Not supposed to keep local backups, so delete the one that was just uploaded
                DeleteLocalBackup(ZIP_NAME).then(deleteLocalBackupResult => {
                    resolve({
                        error: 0,
                        message: "Upload Successful, Deleted Local Copy of Backup",
                        data: data
                    });
                }, deleteLocalBackupError => {
                    resolve({
                        error: 1,
                        message: deleteLocalBackupError,
                        data: data
                    });
                });
            } else {
                // Only keep most recent "noOfLocalBackups" number of backups and delete older
                // backups

                if (config.noOfLocalBackups) {
                    let oldBackupNames = fs
                        .readdirSync(BACKUP_PATH(""))
                        .filter(dirItem => fs.lstatSync(BACKUP_PATH(dirItem)).isFile())
                        .reverse()
                        .slice(config.noOfLocalBackups);

                    oldBackupNames.forEach(fileName => {
                        fs.unlink(BACKUP_PATH(fileName), err => {
                            if (err) {
                                // Do nothing
                            }
                        });
                    });
                }

                resolve({
                    error: 0,
                    message: "Upload Successful",
                    data: data
                });
            }
        });
    });
}

function UploadBackup(config, backupResult) {
    let s3 = AWSSetup(config);

    return UploadFileToS3(s3, backupResult.zipName, config).then(uploadFileResult => {
        return Promise.resolve(uploadFileResult);
    }, uploadFileError => {
        if (uploadFileError.code === "NoSuchBucket") {
            // Bucket Does not exists, So Create one, And Reattempt to Upload
            return CreateBucket(s3, config).then(createBucketResolved => {
                return UploadFileToS3(s3, backupResult.zipName, config).then(uploadFileResult => {
                    return Promise.resolve(uploadFileResult);
                }, uploadFileError => {
                    return Promise.reject(uploadFileError);
                });
            }, createBucketError => {
                return Promise.reject(createBucketError);
            });
        } else {
            return Promise.reject(uploadFileError);
        }
    });
}

function CreateBackup(config) {
    // Backup Mongo Database
    return BackupMongoDatabase(config).then(result => {
        return Promise.resolve({
            error: 0,
            message: "Successfully Created Compressed Archive of Database",
            zipName: result.backupName
        });
    }, error => {
        return Promise.reject(error);
    });
}

function BackupAndUpload(config) {
    // Check if the configuration is valid
    let isValidConfig = ValidateConfig(config);

    if (isValidConfig) {
        // Create a backup of database
        return CreateBackup(config).then(backupResult => {
            // Upload it to S3
            return UploadBackup(config, backupResult).then(res => {
                return Promise.resolve(res);
            }, err => {
                return Promise.reject(err);
            });
        }, backupResult => {
            return Promise.reject(backupResult);
        });
    } else {
        return Promise.reject({
            error: 1,
            message: "Invalid Configuration"
        });
    }
}

module.exports = BackupAndUpload;