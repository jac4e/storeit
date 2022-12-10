const { spawn } = require('child_process');
const { addColors, createLogger, format, LeveledLogMethod, Logger, transports } = require('winston');
const fs = require('fs');

if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

const child = spawn('mongod', ['--config', 'mongodb.conf']);

const logLevels = {
    levels: { critical: 0, error: 1, warning: 2, info: 3},
    colors: {
      critical: "bold black redBG",
      error: "red",
      warning: "yellow",
      info: "green",
      debug: "grey",
      connection: "magenta",
      transaction: "hidden"
    },
  };

addColors(logLevels.colors);

const logger = createLogger({
  level: 'info',
  levels: logLevels.levels,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'storeit' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

// use child.stdout.setEncoding('utf8'); if you want text chunks
child.stdout.setEncoding('utf8').on('data', (data) => {
  // data from standard output is here as buffers
    const lines = data.split("\n");
    if(data[data.length-1] != '\n') {
        lineBuffer = lines.pop();
    }else{
        lineBuffer = '';
    }
    for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        logger.info(line);
    }
});

// since these are streams, you can pipe them elsewhere
child.stderr.setEncoding('utf8').on('data', (data) => {
    // data from standard output is here as buffers
      const lines = data.split("\n");
      if(data[data.length-1] != '\n') {
          lineBuffer = lines.pop();
      }else{
          lineBuffer = '';
      }
      for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          logger.error(line);
      }
});

child.on('close', (code) => {
    if(code === 0) {
        logger.info(`storeit exited with ${code}`)
    } else {
        logger.error(`storeit exited with ${code}`)
    }
});

child.on('error', (err) => {
    logger.error('Failed to start child process.')
});