'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var i18n = require("i18n");
//세션
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');
var luis = require('./routes/luis/luis');
var apiServer = require('./routes/apiServer/apiServer');
var board = require('./routes/board/board');
var learning = require('./routes/learning/learning');
var code = require('./routes/code/code');
var auth = require('./routes/auth/auth');
var menu = require('./routes/menu/menu');
var user = require('./routes/user/user');
var boardMng = require('./routes/board/boardMng');
var bannedWordMng = require('./routes/chatbot/bannedWordMng');
var autoCompleteMng = require('./routes/chatbot/autoCompleteMng');
var smallTalkMng = require('./routes/learning/smallTalkMng');
var qna = require('./routes/qna/qnaMng');

var Logger = require("./config/logConfig");
var logger = Logger.CreateLogger();

var app = express();

process.setMaxListeners(0);

// view engine setup test ydy pjs
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//세션
app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24000 * 60 * 60
    }
   }));

i18n.configure({
    locales: ['en', 'ko'],
    directory: __dirname + '/public/locales',
    queryParameter: 'lang',
    cookie: 'i18n',
});

app.use(i18n.init);

//페이지 요청시마다 세션값이 있는지 확인
app.use(function(req, res, next) {

    if(req.session.sid) {
        res.locals.sid = req.session.sid;
    } else {
        res.locals.sid = null;
    }

    if(req.session.dbValue) {
        res.locals.dbValue = req.session.dbValue;
    } else {
        res.locals.dbValue = null;
    }

    if(req.session.subsKeyList) {
        res.locals.subsKeyList = req.session.subsKeyList;
    } else {
        res.locals.subsKeyList = null;
    }

    if(req.session.subsKey) {
        res.locals.subsKey = req.session.subsKey;
    } else {
        res.locals.subsKey = null;
    }

    if(req.session.simul_url) {
        res.locals.simul_url = req.session.simul_url;
    } else {
        res.locals.simul_url = null;
    }

    if(req.session.selMenu) {
        res.locals.selMenu = req.session.selMenu;
    } else {
        res.locals.selMenu = null;
    }


    next();
});
app.use(function(req, res, next) {

    if (req.session.ChatRelationAppList) {
        res.locals.ChatRelationAppList = req.session.ChatRelationAppList;
    } else {
        res.locals.ChatRelationAppList = null;
    }

    if (req.session.intentList) {
        res.locals.intentList = req.session.intentList;
    } else {
        res.locals.intentList = null;
    }

    if (req.session.utterList) {
        res.locals.utterList = req.session.utterList;
    } else {
        res.locals.utterList = null;
    }

    if (req.session.entityList) {
        res.locals.entityList = req.session.entityList;
    } else {
        res.locals.entityList = null;
    }

    if (req.session.entityChildList) {
        res.locals.entityChildList = req.session.entityChildList;
    } else {
        res.locals.entityChildList = null;
    }
    
    if (req.session.selChatInfo) {
        res.locals.selChatInfo = req.session.selChatInfo;
    } else {
        res.locals.selChatInfo = null;
    }

    if (req.session.selChatAppLength) {
        res.locals.selChatAppLength = req.session.selChatAppLength;
    } else {
        res.locals.selChatAppLength = null;
    }

    if (req.session.selAppId)  {
        res.locals.selAppId = req.session.selAppId;
    } else { 
        res.locals.selAppId = null;
    }

    if (req.session.leftList)  {
        res.locals.leftList = req.session.leftList;
    } else { 
        res.locals.leftList = null;
    }

    if (req.session.appName)  {
        res.locals.appName = req.session.appName;
    } else { 
        res.locals.appName = null;
    }

    if (req.session.appId)  {
        res.locals.appId = req.session.appId;
    } else { 
        res.locals.appId = null;
    }

    // bwj -------------------------------------------------------
    if (req.session.publishsettings) {
        res.locals.publishsettings = req.session.publishsettings;
    } else {
        res.locals.publishsettings = null;
    }

    if (req.session.endpoint) {
        res.locals.endpoint = req.session.endpoint;
    } else {
        res.locals.endpoint = null;
    }

    if (req.session.subscriptions) {
        res.locals.subscriptions = req.session.subscriptions;
    } else {
        res.locals.subscriptions = null;
    }

    if (req.session.version) {
        res.locals.version = req.session.version;
    } else {
        res.locals.version = null;
    }
    // -----------------------------------------------------------

    if (req.session.subKey)  {
        res.locals.subKey = req.session.subKey;
    } else { 
        res.locals.subKey = null;
    }

    if (!res.locals.languageNow ) {
        if (typeof req.cookies.i18n !='undefined') {
            res.locals.languageNow = req.cookies.i18n;
        } else {
            res.locals.languageNow = i18n.getLocale(req);
        }
    }

    if (!res.locals.en) {
        res.locals.en = i18n.getCatalog()['en'];
    }

    if (!res.locals.ko) {
        res.locals.ko = i18n.getCatalog()['ko'];
    }
    
    next();
});


console.log("app.js 들어옴") ;
app.use('/', routes);
app.use('/users', users);
app.use('/luis', luis);
app.use('/apiServer', apiServer);
app.use('/learning', learning);
app.use('/board', board);
app.use('/code', code);
app.use('/auth', auth);
app.use('/menu', menu);
app.use('/user', user);
app.use('/boardMng', boardMng);
app.use('/bannedWordMng', bannedWordMng);
app.use('/autoCompleteMng', autoCompleteMng);
app.use('/smallTalkMng', smallTalkMng);
app.use('/qna', qna);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (req.session.sid) {
            logger.info('[에러페이지] [message : %s] ', err);
            res.render('error');
        } else {
            var userId = req.session.sid;
            logger.info('[에러페이지] [id : %s] [message : %s] ', userId, err);
            res.render('error');
        }
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    if (req.session.sid) {
        logger.info('[에러페이지] [message : %s] ', err);
        res.render('error');
    } else {
        var userId = req.session.sid;
        logger.info('[에러페이지] [id : %s] [message : %s] ', userId, err);
        res.render('error');
    }
});


app.set('port', process.env.PORT || 3000);
console.log("app.js port : " + app.get('port')) ;

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
