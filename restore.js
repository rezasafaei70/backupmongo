const path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec;

const { config, BACKUP_PATH, AWSSetup, validateConfig } = require('./utils/appConfig');

//? 5. restore db
const restoreMongoDatabase = (ZIP_NAME) => {

    return new Promise((resolve, reject) => {
        // Backups are stored in .tmp directory in Project root
        fs.mkdir(path.resolve(".tmp"), (err) => {
            if (err && err.code != "EEXIST") {
                reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 400,
                    message: err.message
                });
            } else {

                fs.readFile(BACKUP_PATH(`${ZIP_NAME}`), 'utf-8', (err, data) => {
                    if (err) {
                        return reject({
                            error: 1,
                            status: 'fail',
                            statusCode: 400,
                            message: "Not Found File!"
                        });
                    }

                    return deleteMongoDatabase().then(result => {
                        const database = config.mongodb.database,
                            password = config.mongodb.password || null,
                            username = config.mongodb.username || null,
                            timezoneOffset = config.timezoneOffset || null,
                            host = config.mongodb.hosts[0].host || null,
                            port = config.mongodb.hosts[0].port || null;


                        // Default command, does not considers username or password
                        let command = `mongorestore --gzip --archive=${BACKUP_PATH(ZIP_NAME)} -h ${host} --port=${port}`;

                        // When Username and password is provided
                        if (username && password) {
                            command = `mongorestore --gzip --archive=${BACKUP_PATH(ZIP_NAME)} -h ${host} --port=${port} -p ${password} -u ${username} --authenticationDatabase admin`;
                        }
                        // When Username is provided
                        if (username && !password) {
                            command = `mongorestore --gzip --archive=${BACKUP_PATH(ZIP_NAME)} -h ${host} --port=${port} -u ${username}`;
                        }


                        exec(command, (err, stdout, stderr) => {
                            if (err) {
                                // Most likely, mongorestore isn't installed or isn't accessible
                                console.error(err.message);
                                reject({
                                    error: 1,
                                    status: 'fail',
                                    statusCode: 400,
                                    message: "It is not possible to execute the restore command"
                                });
                            } else {
                                resolve({
                                    error: 0,
                                    status: 'success',
                                    message: "Successfuly Created Restore",
                                    backupName: ZIP_NAME
                                });
                            }
                        });

                    }, error => {
                        reject(error);
                    });
                });
            }
        });
    });
}

//? 4. delete current db for restore
const deleteMongoDatabase = () => {


    const database = config.mongodb.database,
        password = config.mongodb.password || null,
        username = config.mongodb.username || null,
        host = config.mongodb.hosts[0].host || null,
        port = config.mongodb.hosts[0].port || null;


    // Default command, does not considers username or password
    let command = `mongosh --host ${host}:${port} ${database} --eval "db.dropDatabase()"`;

    // When Username and password is provided
    if (username && password) {
        command = `mongosh --host ${host}:${port} -p ${password} -u ${username} --authenticationDatabase admin ${database} --eval "db.dropDatabase()"`;
    }
    // When Username is provided
    if (username && !password) {
        command = `mongosh --host ${host}:${port} -u ${username} ${database} --eval "db.dropDatabase()"`;
    }

    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(err.message);
                reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 400,
                    message: "It is not possible to execute the delete command"
                });
            } else {
                resolve({
                    error: 0,
                    status: 'success',
                    message: "Database deleted successfully!",
                });
            }
        });
    }
        , error => {
            reject({
                error: 1,
                status: 'error',
                statusCode: 500,
                message: error.message
            });
        });
}

//? 3. call restore
const restore = (downloadResult) => {
    // Restore Mongo Database
    return restoreMongoDatabase(downloadResult.data).then(result => {
        return Promise.resolve({
            error: 0,
            status: 'success',
            message: "The database was restored successfully!",
        });
    }, error => {
        return Promise.reject(error);
    });
}

//? 2.download from s3
const downloadFileFromS3 = (S3, ZIP_NAME) => {
    return new Promise((resolve, reject) => {

        let downloadParams = {
            Bucket: config.s3.bucketName,
            Key: ZIP_NAME
        };
        const stream = S3.getObject(downloadParams).createReadStream();
        const writeStream = fs.createWriteStream(BACKUP_PATH(ZIP_NAME));

        stream.on('end', () => {
            resolve({
                error: 0,
                status: 'success',
                message: "Download Successful",
                data: ZIP_NAME
            });
        });

        stream.on('error', (err) => {
            if (err.code === "NoSuchKey") {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 404,
                    message: 'The file not found!'
                });
            }

            return reject({
                error: 1,
                status: 'fail',
                statusCode: 400,
                message: err.message
            });
        });

        stream.pipe(writeStream);
    }, error => {
        reject({
            error: 1,
            status: 'error',
            statusCode: 500,
            message: error.message
        });
    });
}

//? 1.download file
const downloadBackup = (ZIP_NAME) => {
    let s3 = AWSSetup();
    return downloadFileFromS3(s3, ZIP_NAME).then(downloadFileResult => {
        return Promise.resolve(downloadFileResult);
    }, downloadFileError => {
        if (downloadFileError) {
            return Promise.reject(downloadFileError);
        }
    });
}

//? First, the file is downloaded from the uploaded path on the cloud,
//? then the current database is deleted,
//? and finally the received file is restored.

exports.restore = (ZIP_NAME) => {
    // Check if the configuration is valid
    let isValidConfig = validateConfig();
    if (isValidConfig) {
        // download a backup of database
        return downloadBackup(ZIP_NAME).then(downloadResult => {
            // delete current db and restore 
            return restore(downloadResult).then(res => {
                return Promise.resolve(res);
            }, err => {
                return Promise.reject(err);
            });
        }, downloadResult => {
            return Promise.reject(downloadResult);
        });
    } else {
        return Promise.reject({
            error: 1,
            status: 'fail',
            statusCode: 400,
            message: "Invalid Configuration"
        });
    }
}

exports.restoreFromLocalCopy = (ZIP_NAME) => {
    // Check if the configuration is valid
    let isValidConfig = validateConfig();
    if (isValidConfig) {
        // delete current db and restore 
        return restoreMongoDatabase(ZIP_NAME).then(restoreMongoDatabaseResponse => {
            return Promise.resolve(restoreMongoDatabaseResponse);
        }, restoreMongoDatabaseError => {
            return Promise.reject(restoreMongoDatabaseError);
        });
    } else {
        return Promise.reject({
            error: 1,
            status: 'fail',
            statusCode: 400,
            message: "Invalid Configuration"
        });
    }
}