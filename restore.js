const path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec;

const { config, BACKUP_PATH, AWSSetup, ValidateConfig } = require('./utils/appConfig');

//? 5. restore db
function RestoreMongoDatabase(config, ZIP_NAME) {

    return new Promise((resolve, reject) => {
        // Backups are stored in .tmp directory in Project root
        fs.mkdir(path.resolve(".tmp"), (err) => {
            if (err && err.code != "EEXIST") {
                reject(err);
            } else {


     return DeleteMongoDatabase(config).then(result => {
        console.log("deleted");
        console.log(result);

            console.log(config.mongodb.hosts)
        
                const database = config.mongodb.database,
                    password = null,
                    username = null,
                    timezoneOffset = config.timezoneOffset || null,
                    host = config.mongodb.hosts[0].host || null,
                    port = config.mongodb.hosts[0].port || null;
                console.log("ssssssssssssssssss");
        
        
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
        
                console.log('before*******')
                console.log(command)
        
                exec(command, (err, stdout, stderr) => {
                    console.log(err);
                    console.log(stdout);
                    console.log(stderr);
                    if (err) {
                        console.log('err*******')
        
                        // Most likely, mongodump isn't installed or isn't accessible
                        reject({
                            error: 1,
                            message: err.message
                        });
                    } else {
                        console.log('success*******')
        
                        resolve({
                            error: 0,
                            message: "Successfuly Created Restore",
                            backupName: ZIP_NAME
                        });
                    }
                });
     
    }, error => {
        console.log('***********************error**********************')
        reject(error);
    });
}
});
});
}

//? 4. delete current db for restore
function DeleteMongoDatabase(config) {

    
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

            console.log('ddd')
            console.log(command)
            console.log(err)
            if (err) {
                reject({
                    error: 1,
                    message: err.message
                });
            } else {
                resolve({
                    error: 0,
                    message: "Database deleted successfully!",
                });
            }
        });
    }
    , error => {
        console.log(`===========err`)
        console.log(error)
        reject(error);
    });
}

//? 3. call restore
function Restore(config, downloadResult) {
    // Restore Mongo Database
    return RestoreMongoDatabase(config, downloadResult.data).then(result => {
        return Promise.resolve({
            error: 0,
            message: "The database was restored successfully!",
        });
    }, error => {
        return Promise.reject(error);
    });
}

//? 2.download from s3
function DownloadFileFromS3(S3, ZIP_NAME, config) {
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
                message: "Download Successful",
                data: ZIP_NAME
            });
        });

        stream.on('error', (err) => {
            return reject({
                error: 1,
                message: err.message
            });
        });

        stream.pipe(writeStream);
    }, error => {
        console.log('***********************DownloadFileFromS3**********************')
        reject(error);
    });
}

//? 1.download file
function DownloadBackup(config, ZIP_NAME) {
    let s3 = AWSSetup(config);
    return DownloadFileFromS3(s3, ZIP_NAME, config).then(downloadFileResult => {
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

function DownloadAndRestore(config , ZIP_NAME) {
    // Check if the configuration is valid
    let isValidConfig = ValidateConfig(config);
    if (isValidConfig) {
        // download a backup of database
        return DownloadBackup(config, ZIP_NAME).then(downloadResult => {
            // delete current db and restore 
            return Restore(config, downloadResult).then(res => {
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
            message: "Invalid Configuration"
        });
    }
}

module.exports = DownloadAndRestore;