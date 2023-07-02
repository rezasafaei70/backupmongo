
const AppError = require('./../utils/appError');

exports.isWhiteListedIP = (req, res, next) => {
    if (process.env.WHITELIST === '*' || process.env.WHITELIST.split(',').indexOf(req.ip.replace('::ffff:', '')) !== -1)
        next();
    else
        new AppError('Invalid request', 403)
}

exports.SafeConnect = (origin, callback) => {
    if (process.env.WHITELIST === '*' || process.env.WHITELIST.split(',').indexOf(origin) !== -1)
        callback(null, true);
    else
        callback(new AppError('Origin not allowed by CORS', 403));
}
