// Usually, It'll be
// when you installed the package using yarn or npm
// but in example here, I used backup.js directly.

const backup = require("./backup.js");
const {config,write_file,create_dir , logFilePath}= require("./utils/appConfig.js")


//  For one time backup
exports.initialBackup = ()=>{
    backup(config).then(resolved => {
        // console.log(resolved);
        var dir = create_dir();
        write_file(logFilePath, resolved);
    
    }, rejected => {
        console.error(rejected);
    });
}


// For backups with some intervals.
exports.automatedBackup = ()=>{
    setInterval(() => {
        backup(backupConfig2).then(resolved => {
            var dir = create_dir();
            write_file(dir, resolved)
            console.log(resolved);
        }, rejected => {
            console.error(rejected);
        });
    }, 60 * 60 * 1 * 1000);
}


