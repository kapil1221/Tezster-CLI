const winston = require('winston');
const { format } = require('winston');

let silent;

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 5
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'gray'
  }
};

const options = {
    console: {
        level : 'info',
        silent,
        handleExceptions: true,
        format: format.combine(
            format.colorize({ all: true }),
            format.splat(),
            format.printf(
              info => `${info.message}`,
            ),
        ),
    },
    file: {
        filename: '/tmp/tezster-logs/tezster-command-logs.log',
        level : 'verbose',
        silent,
        handleExceptions: true,
        format: format.combine(
            format.colorize({ all: true }),
            format.splat(),
            format.printf(
              info => `${new Date().toISOString()}  Message : ${info.message}`,
            ),
        ),
    },
};

winston.addColors(logLevels);
const Logger = winston.createLogger({
  levels: winston.config.npm.levels,
  transports: [
    new winston.transports.Console( options.console ),
    new winston.transports.File( options.file )
  ],
});

module.exports = Logger;
