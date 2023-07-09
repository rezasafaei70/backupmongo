
const AppError = require('./../utils/appError');
const logger = require('./../logger')(module);

exports.isWhiteListedIP = (req, res, next) => {

    logger.info("isWhiteListedIP", { whiteList: process.env.WHITELIST, ip: req.ip });

    if (process.env.ENABLE_CHECKIP !== 'true' || process.env.WHITELIST === '*'
        || process.env.WHITELIST.split(',').indexOf(req.ip.replace('::ffff:', '')) !== -1)
        next();
    else {
        logger.error("isWhiteListedIP-invalid request", { whiteList: process.env.WHITELIST, ip: req.ip });
        new AppError('Invalid request', 403);
    }
}

exports.SafeConnect = (origin, callback) => {

    logger.info("SafeConnect", { whiteList: process.env.WHITELIST, origin: origin });

    if (process.env.WHITELIST === '*' || process.env.WHITELIST.split(',').indexOf(origin) !== -1)
        callback(null, true);
    else {
        logger.error("SafeConnect-Origin not allowed by CORS", { whiteList: process.env.WHITELIST, origin: origin });
        callback(new AppError('Origin not allowed by CORS', 403));
    }
}
