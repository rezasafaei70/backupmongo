const path = require('path')
const restore = require('./../restore');

exports.restoreDB = (req, res, next) => {

    if (!req.body.key) {
        res.status(400).json({
            status: 'fail',
            message: 'The input information is invalid!'
        });
    }

    if (path.extname(req.body.key) !== '.gz') {
        res.status(400).json({
            status: 'fail',
            message: 'File does not have .gz extension!'
        });
    }

    restore(req.body.key).then(resolved => {
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
