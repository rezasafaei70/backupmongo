
const { config, AWSSetup, delete_fileRows, upload_file, logFilePath } = require('./utils/appConfig');

//? delete files in the storage
const deleteStorageBackups = exports.deleteStorageBackups = (objectsToDelete) => {

    //?config aws setup
    let s3 = AWSSetup();

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
const getFilesInDirectory = exports.getFilesInDirectory = () => {
    //?config aws setup
    let s3 = AWSSetup();

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
exports.deleteStorageBackupsByDate = () => {

    if (!config.deleteStorageBackups) {
        return Promise.reject({
            error: 1,
            status: 'fail',
            statusCode: 400,
            message: "The settings for deleting backups on storage are disabled!"
        });
    }

    return new Promise((resolve, reject) => {
        //? getall files from storage
        getFilesInDirectory().then((getFilesInDirectoryResponse) => {
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
            deleteStorageBackups(filteredObjects)
                .then((deleteStorageBackupsResponse) => {

                    const length = deleteStorageBackupsResponse.data.files.length;
                    if (length === 0) {
                        return reject(deleteStorageBackupsResponse);
                    }

                    //? update log text file
                    delete_fileRows(logFilePath, filteredObjects.map((file) => file.Key))
                        .then((response) => {
                            //?upload log text file on the storage
                            upload_file(logFilePath).then((res) => {
                                resolve({
                                    error: 0,
                                    data: { length },
                                    status: 'success',
                                    message: "upload the log file was done successfully after deleting the files!"
                                });
                            })
                        })
                        .catch((error) => {
                            return reject(error);
                        });
                })
                .catch((error) => {
                    return reject(error);
                });
        })
            .catch((error) => {
                return reject(error);
            });
    });
}

//? get file url with authentication header, for client download it
exports.getSignedFileUrl = (key) => {

    return new Promise((resolve, reject) => {

        if (!key) {
            return reject({
                error: 1,
                status: 'fail',
                statusCode: 400,
                message: 'The input information is invalid!'
            });
        }

        let s3 = AWSSetup();
        const params = {
            Bucket: process.env.BUCKETNAME,
            Key: key
        };

        s3.getSignedUrlPromise('getObject', params)
            .then(url => {
                resolve({
                    error: 0,
                    status: 'success',
                    message: 'The URL was received successfully!',
                    data: { url }
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