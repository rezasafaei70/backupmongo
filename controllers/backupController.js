const backup = require('./../backup');
const storageHandler = require('./../storageHandler');
const pingServer = require('./../utils/pingServer');

exports.backupDB = (req, res, next) => {
    backup().then(resolved => {
        res.status(200).json({
            status: resolved.status,
            message: resolved.message
        });

    }, rejected => {
        console.error(rejected);
        res.status(rejected.statusCode || 500).json({
            status: rejected.status,
            message: rejected.message
        });
    }).catch(err => {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    });
}

exports.directory = (req, res, next) => {
    storageHandler.getFilesInDirectory().then(resolved => {
        res.status(200).json({
            status: resolved.status,
            message: resolved.message,
            data: {
                files: resolved.data.files
                    .map(file => ({
                        Key: file.Key,
                        LastModified: file.LastModified,
                        Size: file.Size
                    }))
            }
        });
    }, rejected => {
        console.error(rejected);
        res.status(rejected.statusCode).json({
            status: rejected.status,
            message: rejected.message
        });
    }).catch(err => {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    });
}

exports.deleteStorageBackups = (req, res, next) => {
    storageHandler.deleteStorageBackupsByDate().then(resolved => {
        res.status(200).json({
            status: resolved.status,
            message: resolved.message
        });
    }, rejected => {
        console.error(rejected);
        res.status(rejected.statusCode).json({
            status: rejected.status,
            message: rejected.message
        });
    }).catch(err => {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    });
}

exports.ping = (req, res, next) => {
    pingServer(process.env.LOCALHOST, process.env.LOCALPORT, 5000)
        .then((isActive) => {
            const message = `Server status is ${isActive ? 'active' : 'inactive'}!`;
            console.log(message);
            res.status(200).json({

                status: 'success',
                message
            });
        })
        .catch(() => {
            const message = 'Server is not responding!';
            console.log(message);
            res.status(500).json({
                status: 'error',
                message
            });
        });
}

exports.getFileFromStorage = (req, res, next) => {

    const key = req.params.name;
    if (!key) {
        res.status(400).json({
            status: 'fail',
            message: 'The input information is invalid!'
        });
    }

    storageHandler.getSignedFileUrl(key).then(resolved => {
        res.status(200).json({
            status: resolved.status,
            message: resolved.message,
            data: resolved.data
        })
    }, rejected => {
        console.error(rejected);
        res.status(rejected.statusCode).json({
            status: rejected.status,
            message: rejected.message
        });
    }).catch(err => {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    });
}