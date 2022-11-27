// Usually, It'll be
// const backup = require('s3-mongo-backup')
// when you installed the package using yarn or npm
// but in example here, I used backup.js directly.
const backup = require("./backup.js");
var fs = require('fs');
require('dotenv').config()
console.log(process.env)
var backupConfig2 = {
    // mongodb: `mongodb://${process.env.USERNAME}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT}/${process.env.DATABSE}`,
    mongodb: {
        "database": process.env.DATABSE,
        "host": process.env.HOST,
        "username":process.env.USERNAME,
        "password":process.env.PASSWORD,
        "port": process.env.PORT
    },
    s3: {
        accessKey: process.env.ACCESSKEY,  //AccessKey
        secretKey: process.env.SECRETKEY,  //SecretKey
        endpoint: process.env.ENDPOINT,     //S3 Bucket Region
        accessPerm: process.env.ACCESSPERM,
        bucketName: process.env.BUCKETNAME
    },
    keepLocalBackups: false, //If true, It'll create a folder in project root with database's name and store backups in it and if it's false, It'll use temporary directory of OS.
    noOfLocalBackups: 2, //This will only keep the most recent 5 backups and delete all older backups from local backup directory
    timezoneOffset: 300 //Timezone, Used in naming backups, It is assumed to be in hours if less than 16 and in minutes otherwise
};
function create_dir(){
    let date_ob = new Date();
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let hours = date_ob.getHours();
    let day = date_ob.getDay();
    let year = date_ob.getFullYear();
    var dir = `./database/temp/${year}/${month}/${day}/${hours}/`;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
    return dir
}

function write_file(dir,resolved){

    fs.writeFile(`${dir}backup.txt`, JSON.stringify(resolved), function (err) {
        if (err) throw err;
   
        console.log('It\'s saved!');
    });

}
//  For one time backup
backup(backupConfig2).then(resolved => {
    console.log(resolved);
    var dir = create_dir();
    write_file(dir,resolved)

}, rejected => {
    console.error(rejected);
});

// For backups with some intervals.
setInterval(() => {
    backup(backupConfig2).then(resolved => {
        var dir = create_dir();
        write_file(dir,resolved)
        console.log(resolved);
    }, rejected => {
        console.error(rejected);
    });
}, 60 * 60 * 1 * 1000 );


