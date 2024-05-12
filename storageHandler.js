
const { config, AWSSetup } = require('./utils/appConfig');
const helper = require('./utils/helper');

//? delete files in the storage
const deleteStorageBackups = exports.deleteStorageBackups = (objectsToDelete) => {

    //?config aws setup
    const s3 = AWSSetup();

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
                    data: { length: data.Deleted.length }
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


const listAllContents = async ({ Bucket, Prefix }) => {
    //?config aws setup
    let s3 = AWSSetup();
    // repeatedly calling AWS list objects because it only returns 1000 objects
    let list = [];
    let shouldContinue = true;
    let nextContinuationToken = null;
    while (shouldContinue) {
        let res = await s3
            .listObjectsV2({
                Bucket,
                Prefix,
                ContinuationToken: nextContinuationToken || undefined,
            })
            .promise();
        list = [...list, ...res.Contents];

        if (!res.IsTruncated) {
            shouldContinue = false;
            nextContinuationToken = null;
        } else {
            nextContinuationToken = res.NextContinuationToken;
        }
    }
    return list;
};

//? get storage files
exports.getFilesInDirectory = () => {

    return new Promise((resolve, reject) => {

        listAllContents({ Bucket: config.s3.bucketName, Prefix: undefined }).then((data) => {

            const files = data.sort(x => -new Date(x.LastModified))
                .map(file => ({
                    Key: file.Key,
                    LastModified: helper.formattedDate(file.LastModified),
                    Size: `${helper.bytesToMB(file.Size)} MB`
                }));

            resolve({
                error: 0,
                status: 'success',
                message: "data retrieved successfull!",
                data: files
            });

        }).catch((error) => {
            return reject({
                error: 1,
                status: 'error',
                statusCode: 500,
                message: error.message
            });
        });

    });
}


//? delete files in the storage a few days ago, then update the log file and upload that to the storage
exports.deleteStorageBackupsByDate = (daysAgo) => {

    if (!config.deleteStorageBackups) {
        return Promise.reject({
            error: 1,
            status: 'fail',
            statusCode: 400,
            message: "The settings for deleting backups on storage are disabled!"
        });
    }

    if (daysAgo && daysAgo * 1 <= 5) {
        return Promise.reject({
            error: 1,
            status: 'fail',
            statusCode: 400,
            message: "Invalid daysAgo number!"
        });
    }

    return new Promise((resolve, reject) => {

        listAllContents({ Bucket: config.s3.bucketName, Prefix: undefined }).then((data) => {

            if (data.length === 0)
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 404,
                    message: 'not found data!'
                });

            //? filter files by date
            const today = new Date();
            daysAgo = daysAgo ? daysAgo : config.daysAgoDeleteStorageBackups;
            const daysAgoDate = new Date(today.setDate(today.getDate() - daysAgo * 1));

            const filteredObjects = data.filter(file =>
                new Date(file.LastModified).getTime() < daysAgoDate.getTime() && file.Key.endsWith('.gz'))
                .map((file) => ({ Key: file.Key }));

            if (filteredObjects.length === 0) {
                return reject({
                    error: 1,
                    status: 'fail',
                    statusCode: 404,
                    message: 'no data was found days ago!'
                });
            }

            const limit = 2;
            let deletedItems = 0;
            const deletingRange = Math.ceil(filteredObjects.length / limit);
            for (let f = 0; f < deletingRange; f++) {
                //? delete files from storage
                deleteStorageBackups(filteredObjects.slice(f, limit * (f + 1)))
                    .then((deleteStorageBackupsResponse) => {
                        deletedItems += deleteStorageBackupsResponse;
                        if (f === deletingRange - 1) {
                            resolve(deleteStorageBackupsResponse);
                        }
                    })
                    .catch((error) => {
                        return reject(error);
                    });
            }

        }).catch((error) => {
            return reject({
                error: 1,
                status: 'error',
                statusCode: 500,
                message: error.message
            });
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