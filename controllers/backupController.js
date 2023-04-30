const backup = require('./../backup');
const storageHandler = require('./../storageHandler');

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
            data: {files: resolved.data.files
                .map(file=>({Key: file.Key,
                 LastModified:file.LastModified,
                 Size:file.Size})) }
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

