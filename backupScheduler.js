// Usually, It'll be
// when you installed the package using yarn or npm
// but in example here, I used backup.js directly.

const ms = require('ms');
const backup = require("./backup.js");

// set interval time to ms for executing automatic backup
// sample: 1d, 1h, 5m, 5s
const intervalTime = ms(process.env.BACKUP_INTERVALTIME);

console.log('interval time backup:', intervalTime);

//?logger
const logger = require('./logger.js')(module);

//  For one time backup
exports.initialBackup = () => {
    try {
        backup().then(resolved => {
            console.error({
                status: resolved.status,
                message: resolved.message
            });
            logger.info("initialBackup-resolve", { resolved });

        }, rejected => {
            console.error({
                status: rejected.status,
                message: rejected.message
            });
            logger.warn("initialBackup-reject", { rejected });

        }).catch(err => {
            console.error({
                status: 'error',
                message: err.message
            });
            logger.error("initialBackup-error", { err });

        });
    }
    catch (err) {
        console.error({
            status: 'error',
            message: err.message
        });
        logger.error("initialBackup-exception", {}, err.stack);
    }
}

// For backups with some intervals.
exports.automatedBackup = () => {
    try {
        setInterval(() => {
            backup().then(resolved => {
                console.error({
                    status: resolved.status,
                    message: resolved.message
                });
                logger.info("automatedBackup-resolve", { resolved });
            }, rejected => {
                console.error({
                    status: rejected.status,
                    message: rejected.message
                });
                logger.warn("automatedBackup-reject", { rejected });
            }).catch(err => {
                console.error({
                    status: 'error',
                    message: err.message
                });
                logger.error("automatedBackup-error", { err });
            });
        }, intervalTime);
    }
    catch (err) {
        console.error({
            status: 'error',
            message: err.message
        });
        logger.error("automatedBackup-exception", {}, err.stack);
    }
}


