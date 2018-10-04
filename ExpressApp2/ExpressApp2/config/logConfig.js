var winston = require('winston');
var winstonDaily = require('winston-daily-rotate-file');
var moment = require('moment');

const _logDir = 'C:/logs/server/LOGFILE.log';
//const _logDir = 'C:/Users/cbadmin/Desktop/ExpressApp2/ExpressApp2/logs/LOGFILE.log';

module.exports.CreateLogger = function () {

    var appenders = [];

    appenders.push(new winston.transports.DailyRotateFile({
        //prepend: true,  
        datePattern: 'YYYY-MM-DD',
        json: false,
        filename: _logDir,
        timestamp: function () {    
            return moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ')
        },
        formatter: function (options) {
            return options.timestamp() + ' ' + options.message;
        }
    }));
    /*
    appenders.push(new winston.transports.Console({
        json: false,
        timestamp: function () {    //�α� �ۼ��� ��¥ ����
            return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')
        },
        formatter: function (options) {
            return options.timestamp() + ' ' + options.message;
        }
    }));
    */
    try{
        var logger = new winston.Logger({
            level: 'debug',
            transports: appenders
        });
    }
    catch(e) {
        Debug.write(e);
    }

    return logger;
};
