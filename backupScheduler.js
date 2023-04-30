// Usually, It'll be
// when you installed the package using yarn or npm
// but in example here, I used backup.js directly.

const backup = require("./backup.js");

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
    }, 60 * 60 * 1 * 1000);
}


