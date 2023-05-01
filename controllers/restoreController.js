const path = require('path');
const { restore, restoreFromLocalCopy } = require('./../restore');
const uploadMiddleware = require('./../utils/uploadMiddleware');

const uploadBackupFile = uploadMiddleware.single('file');

exports.restoreDB = (req, res, next) => {

    const key = req.body.fileName;

    if (!key) {
        res.status(400).json({
            status: 'fail',
            message: 'The input information is invalid!'
        });
    }

    if (path.extname(key) !== '.gz') {
        res.status(400).json({
            status: 'fail',
            message: 'File does not have .gz extension!'
        });
    }

    restore(key).then(resolved => {
        res.status(200).json({
            status: 'success',
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
    })
}

exports.restoreDBFromLocalCopy = function (req, res) {
    uploadBackupFile(req, res, function (err) {
        if (err) {
            res.status(400).json({
                status: 'fail',
                message: err.message
            });
        }
        else if (!req.file) {
            res.status(400).json({
                status: 'fail',
                message: 'Please upload a file!'
            });
        }
        else {
            restoreFromLocalCopy(req.file.originalname)
                .then(resolved => {
                    res.status(200).json({
                        status: 'success',
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
    });
};