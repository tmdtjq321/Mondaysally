var winston = require('winston')
const winstonDaily = require('winston-daily-rotate-file')

const errDir = 'log/error'
const infoDir = 'log'
const { combine, timestamp, printf } = winston.format

const logFormat = printf(({ timestamp, level, message, stack, idx }) => {
    if (stack) return `${timestamp} ${level} - ${message} - ${stack} - ${idx}`
    else return `${timestamp} ${level} - ${message}`
})

var logger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        logFormat,
    ),
    transports: [
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: infoDir,
            filename: `info.%DATE%.log`,
            maxFiles: 30,
            zippedArchive: true,
        }),

    ],
});

var errLogger = winston.createLogger({
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        logFormat,
    ),
    transports: [
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: errDir,
            filename: `error.%DATE%.log`,
            maxFiles: 30,
            zippedArchive: true,
        }),

    ],
});

const logmessage = (message, stack, idx) => {
    return {
        message: message,
        stack: stack,
        idx: idx
    }
};

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
        )
    }));
    errLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
        )
    }));
}

module.exports = {
    logger: logger,
    errLogger: errLogger,
    logmessage : logmessage
};