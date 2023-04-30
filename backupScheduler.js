// Usually, It'll be
// when you installed the package using yarn or npm
// but in example here, I used backup.js directly.

const ms = require('ms');
const backup = require("./backup.js");

// set interval time to ms for executing automatic backup
// sample: 1d, 1h, 5m, 5s
const intervalTime = ms(process.env.BACKUP_INTERVALTIME);

console.log('interval time backup:', intervalTime);

//  For one time backup
exports.initialBackup = ()=>{
    backup().then(resolved => {        
        console.error({
            status: resolved.status,
            message: resolved.message
        });

    }, rejected => {
        console.error({
            status: rejected.status,
            message: rejected.message
        });
    }).catch(err => {
        console.error({
            status: 'error',
            message: err.message
        });
    });
}

// For backups with some intervals.
exports.automatedBackup = ()=>{
    setInterval(() => {
        backup().then(resolved => {        
            console.error({
                status: resolved.status,
                message: resolved.message
            });
    
        }, rejected => {
            console.error({
                status: rejected.status,
                message: rejected.message
            });
        }).catch(err => {
            console.error({
                status: 'error',
                message: err.message
            });
        });
    }, intervalTime);
}


