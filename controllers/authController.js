
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const signToken = (user) => {
    return jwt.sign({ username: user.username, password: user.password }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    try {
        const token = signToken(user);

        const cookieOptions = {
            expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
        };

        if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

        res.cookie('jwt', token, cookieOptions);

        return res.status(statusCode).json({
            status: 'success',
            token
        });
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
};

exports.signin = (req, res, next) => {
    try {
        //? 1. check email and password exist
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                status: 'fail',
                message: 'please provide your email and password!'
            });
        }
        //? 2. check user exist and password is correct
        const user = {
            username: process.env.API_USERNAME,
            password: process.env.API_PASSWORD
        };

        if (user.username !== username || user.password !== password) {
            return res.status(401).json({
                status: 'fail',
                message: 'incorrect username or password!'
            });
        }

        //? 3. if every thing is ok, then send token to client
        createSendToken(user, 200, res);
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

exports.protect = async (req, res, next) => {
    try {
        //? 1.getting token and exist it
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: 'you are not logged in! please log in to get access...'
            });
        }
        //? 2.verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        //? 3.check exist user
        const user = {
            username: process.env.API_USERNAME,
            password: process.env.API_PASSWORD
        };

        if (user.username !== decoded.username || user.password != decoded.password) {
            return res.status(401).json({
                status: 'fail',
                message: 'the user belonging to this token does no longer exist!'
            });
        }

        //? grant access to protected route
        next();
    }
    catch (err) {
        return res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
}

