const backup = require('./../backup');
const storageHandler = require('./../storageHandler');
const pingServer = require('./../utils/pingServer');

exports.backupDB = (req, res, next) => {
    try {
        backup().then(resolved => {
            return res.status(200).json({
                status: resolved.status,
                message: resolved.message
            });

        }, rejected => {
            console.error(rejected);
            return res.status(rejected.statusCode || 500).json({
                status: rejected.status,
                message: rejected.message
            });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({
                status: 'error',
                message: err.message
            });
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

exports.directory = (req, res, next) => {
    try {
        storageHandler.getFilesInDirectory().then(resolved => {
            const files = resolved.data || [];
            res.status(200).json({
                status: resolved.status,
                message: resolved.message,
                data: {
                    files,
                    length: files.length
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
            return res.status(500).json({
                status: 'error',
                message: err.message
            });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

exports.deleteStorageBackups = (req, res, next) => {
    try {
        storageHandler.deleteStorageBackupsByDate(req.body.daysAgo).then(resolved => {
            return res.status(200).json({
                status: resolved.status,
                message: resolved.message,
                data: resolved.data
            });
        }, rejected => {
            console.error(rejected);
            return res.status(rejected.statusCode).json({
                status: rejected.status,
                message: rejected.message
            });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({
                status: 'error',
                message: err.message
            });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

exports.ping = (req, res, next) => {
    try {
        pingServer(process.env.LOCALHOST, process.env.LOCALPORT, 5000)
            .then((isActive) => {
                const message = `Server status is ${isActive ? 'active' : 'inactive'}!`;
                console.log(message);
                return res.status(200).json({

                    status: 'success',
                    message
                });
            })
            .catch(() => {
                const message = 'Server is not responding!';
                console.log(message);
                return res.status(500).json({
                    status: 'error',
                    message
                });
            });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

exports.getFileFromStorage = (req, res, next) => {
    try {
        const key = req.params.name;
        if (!key) {
            return res.status(400).json({
                status: 'fail',
                message: 'The input information is invalid!'
            });
        }

        storageHandler.getSignedFileUrl(key).then(resolved => {
            return res.status(200).json({
                status: resolved.status,
                message: resolved.message,
                data: resolved.data
            })
        }, rejected => {
            console.error(rejected);
            return res.status(rejected.statusCode).json({
                status: rejected.status,
                message: rejected.message
            });
        }).catch(err => {
            console.error(err);
            return res.status(500).json({
                status: 'error',
                message: err.message
            });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}