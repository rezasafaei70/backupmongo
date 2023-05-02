const path = require('path');

const { restore, restoreFromLocalCopy } = require('./../restore');
const uploadMiddleware = require('./../utils/uploadMiddleware');
const { encrypt, decrypt } = require('../utils/appEncryptor');

const uploadBackupFile = uploadMiddleware.single('file');

exports.restoreDB = (req, res, next) => {
    try {
        const key = req.body.fileName;

        if (!key) {
            return res.status(400).json({
                status: 'fail',
                message: 'The input information is invalid!'
            });
        }

        if (path.extname(key) !== '.gz') {
            return res.status(400).json({
                status: 'fail',
                message: 'File does not have .gz extension!'
            });
        }

        restore(key).then(resolved => {
            return res.status(200).json({
                status: 'success',
                message: resolved.message
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
        })
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

exports.restoreDBFromLocalCopy = (req, res, next) => {
    try{
    uploadBackupFile(req, res, function (err) {
        if (err) {
            return res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
        else if (!req.file) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please upload a file!'
            });
        }
        else {
            restoreFromLocalCopy(req.file.originalname)
                .then(resolved => {
                    return res.status(200).json({
                        status: 'success',
                        message: resolved.message
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
        }
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

exports.permissionRestorer = (req, res, next) => {
    try {
        const key = req.headers['pair-key'];
        if (!key) {
            return res.status(400).json({
                status: 'fail',
                message: 'The input information is invalid!'
            });
        }
        //?check permission for restore db
        else if (decrypt(key) !== process.env.key) {
            return res.status(403).json({
                status: 'fail',
                message: 'you dont have permission to perform this action!'
            });
        }

        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

exports.generateKey = (req, res, next) => {
    try {
        const hash = encrypt(process.env.KEY);

        if (!hash) {
            return res.status(400).json({
                status: 'fail',
                message: 'Unable to complete your request at this time!'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: { key: hash.content }
        });

    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};
