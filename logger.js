const path = require('path');
const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logLevels = process.env.LOG_LEVELS.split(',');

//? create transport for all type of level
const createTransport = (level) => {
    if (level)
        return new transports.File({ filename: 'backupLogs/error.log', level: 'error' })

    return new DailyRotateFile({
        filename: `backupLogs/%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    });
}

//? create loggerBase for each level
const createLoggerBase = (levelItem) => {

    //? config winston log
    return createLogger({
        format: format.combine(
            format.timestamp(),
            format.errors({ stack: true }), // save callstack when happen error
            format.printf((info) => { //format of save data in log file
                return `${info.level}: ${info.message} ${info.metaData} ${info.metaDataError} \n${info.stack || ''}`;
            }),
            format.splat(),
            format.json()
        ),
        statusLevels: true,
        transports: [
            levelItem ? createTransport(levelItem) : createTransport()
        ],
        exitOnError: false

    });
}

//? create logger
const loggerBase = createLoggerBase();
const errorLoggerBase = logLevels.includes('error') ? createLoggerBase('error') : null;

//? parseStack funcion: get line-fileName-functionName of error
const parseStack = (stackStr) => {
    try {
        if (!stackStr) return null;

        const lines = stackStr.split('\n');
        const [, errorMessage] = lines[0].split(': ');
        const stackLines = lines.slice(1);
        const firstLineParts = stackLines[0].match(/at (.+) \((.+):(\d+):\d+\)/);
        if (!firstLineParts) {
            return null;
        }
        return {
            errorMessage,
            functionName: firstLineParts[1],
            fileName: path.basename(firstLineParts[2]),
            lineNumber: parseInt(firstLineParts[3], 10),
        };
    } catch (e) {
        return null;
    }
}


//? get the file name from the module for save in log file
const logger = (module) => {
    const setLogData = (message, vars, stack) => {
        const pathFile = module.id
        const logResult = { message, pathFile, stack };
        if (vars) {
            logResult.metaData = vars
        }
        if (stack) {
            logResult.metaDataError = parseStack(stack);
        }
        return logResult;
    };

    return {
        //?information
        info: (message, vars) => {
            if (logLevels.includes('info')) {
                loggerBase.info(setLogData(message, vars));
            }
            else return;
        },
        //?debug
        debug: (message, vars) => {
            if (logLevels.includes('debug')) {
                loggerBase.debug(setLogData(message, vars));
            }
            else return;
        },
        //?error
        error: (message, vars, stack) => {
            if (logLevels.includes('error')) {
                errorLoggerBase.error(setLogData(message, vars, stack));
                loggerBase.error(setLogData(message, vars, stack));
            }
            else return;
        },
        //?warning
        warn: (message, vars) => {
            if (logLevels.includes('warn')) {
                loggerBase.warn(setLogData(message, vars));
            }
            else return;
        }
    }
};

module.exports = logger;
