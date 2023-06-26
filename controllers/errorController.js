
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    //Operational ,Trusted Error : send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    //Programming ,Unknown Error : Dont leak error  details
    else {
        // 1.Log error
        console.log('Error', err);

        // 2.Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!',
        });
    }
};



module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.name = err.name;
        error.errmsg = err.errmsg;
        error.message = err.message;
        sendErrorProd(error, res);
    }
};