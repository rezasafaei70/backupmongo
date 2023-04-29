const restore = require('./../restore');
const { config } = require('./../utils/appConfig');

exports.restoreDB = (req, res, next) => {
    const { key } = req.params;
    restore(config, key).then(resolved => {
        res.status(200).json({
            status: 'success',
            message: resolved.message
        });

    }, rejected => {
        console.error(rejected);
        res.status(500).json({
            status: 'error',
            message: rejected.message
        });
    }).catch(err=>{
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    })
}
