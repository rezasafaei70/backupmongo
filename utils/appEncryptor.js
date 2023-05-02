const crypto = require('crypto');
const algorithm = 'aes-256-cbc'
const secretKey = process.env.SECRET_KEY;
const iv = crypto.randomBytes(16);

const AppError = require('./appError');

const encrypt = text => {
    try {
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('hex')
        }
    }
    catch (err) {
        new AppError(`Please check your input and try again`, 400);
    }
}

const decrypt = content => {
    try {
        const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);

        return decrpyted.toString();
    }
    catch (err) {
        new AppError(`Please check your input and try again`, 400);
    }
}

module.exports = {
    encrypt,
    decrypt
}