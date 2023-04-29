
const { AWSSetup, delete_fileRows, uploadFile, logFilePath, ValidateConfig } = require('./utils/appConfig');

//? delete files in the storage
const deleteStorageBackups = (config, objectsToDelete) => {

    //?config aws setup
    let s3 = AWSSetup(config);

    //? the sample of objects to delete
    // const objectsToDelete = [
    //     { Key: 'value' }
    //   ]

    //? delete all files from storage
    return new Promise((resolve, reject) => {

        s3.deleteObjects({ Bucket: config.s3.bucketName, Delete: { Objects: objectsToDelete } })
            .promise()
            .then(data => {
                resolve({
                    error: 0,
                    status: 'success',
                    message: "data deleted successfull!",
                    data: { files: data.Deleted }
                });
            })
            .catch(err => {
                return reject({
                    error: 1,
                    status: 'error',
                    statusCode: 500,
                    message: err.message
                });
            });
    });
}

//? get storage files
const getFilesInDirectory = (config) => {
    //?config aws setup
    let s3 = AWSSetup(config);

    //?get list of objects
    return new Promise((resolve, reject) => {
        s3.listObjects({ Bucket: config.s3.bucketName })
            .promise()
            .then(data => {
                const files = data.Contents.map(file => file);
                resolve({
                    error: 0,
                    status: 'success',
                    message: "data retrieved successfull!",
                    data: { files }
                });
            })
            .catch(err => {
                return reject({
                    error: 1,
                    status: 'error',
                    statusCode: 500,
                    message: err.message
                });
            });
    });
}

//? delete files in the storage a few days ago, then update the log file and upload that to the storage
exports.deleteStorageBackupsByDate = (config) => {
    return new Promise((resolve, reject) => {
        let isValidConfig = ValidateConfig(config);
        if (isValidConfig) {

        }

        //? getall files from storage
        getFilesInDirectory(config).then((getFilesInDirectoryResponse) => {
            if (getFilesInDirectoryResponse.data.files.length === 0) {
                return reject(getFilesInDirectoryResponse);
            }

            //? filter files by date
            let today = new Date();
            let daysAgoDate = new Date(today.setDate(today.getDate() - config.daysAgoDeleteStorageBackups * 1));
            const filteredObjects = getFilesInDirectoryResponse.data.files
                .filter(file => new Date(file.LastModified).getTime() < daysAgoDate.getTime() && file.Key.endsWith('.gz'))
                .map((file) => ({ Key: file.Key }));

            if (filteredObjects.length === 0) {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 404,
                    message: 'no data was found days ago!'
                });
            }

            //? delete files from storage
            deleteStorageBackups(config, filteredObjects)
                .then((deleteStorageBackupsResponse) => {
                    if (deleteStorageBackupsResponse.data.files.length === 0) {
                        return reject(deleteStorageBackupsResponse);
                    }

                    //? update log text file
                    delete_fileRows(logFilePath, filteredObjects.map((file) => file.Key))
                        .then((response) => {
                            //?upload log text file on the storage
                            uploadFile(config, logFilePath).then((res) => {
                                resolve({
                                    error: 0,
                                    status: 'success',
                                    message: "upload the log file was done successfully after deleting the files!"
                                });
                            })
                        })
                        .catch((error) => {
                            return reject({
                                error: 1,
                                status: error.status,
                                statusCode: error.statusCode,
                                message: error.message
                            });
                        });
                })
                .catch((error) => {
                    return reject({
                        error: 1,
                        status: error.status,
                        statusCode: error.statusCode,
                        message: error.message
                    });
                });
        })
            .catch((error) => {
                return reject({
                    error: 1,
                    status: error.status,
                    statusCode: error.statusCode,
                    message: error.message
                });
            });
    });
}


