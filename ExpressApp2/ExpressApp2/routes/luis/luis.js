'use strict';
var express = require('express');
var Client = require('node-rest-client').Client;
var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');
var paging = require('../../config/paging');
var util = require('../../config/util');

var i18n = require("i18n");

var paging = require('../../config/paging');

const syncClient = require('sync-rest-client');
const appDbConnect = require('../../config/appDbConnect');

var router = express.Router();

//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end

var luisUtil = require("../../config/luisUtil");

var luisConfig = require("../../config/luisConfig");
const HOST = luisConfig.HOST_URL;
var subKey = luisConfig.subKey;

var options = {
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': subKey
    }
};

router.get('/synchronizeLuis', function (req, res) {
    
    var userId = req.session.sid;

    var luisObj = [];

    var selectIntentQry = "";
    var selectedAppList = [];
    var selectedIntentList = [];

    var leftList = req.session.leftList;
    var chatNum = -1;
    for (var ii = 0; ii< leftList.length; ii++) {
        if (leftList[ii].CHATBOT_NAME == req.session.appName) {
            chatNum = leftList[ii].CHATBOT_NUM;
            break;
        }
    }

    if (chatNum != -1) {
        var ChatRelationAppList = req.session.ChatRelationAppList;

        for (var jj = 0; jj< ChatRelationAppList.length; jj++) {
            if (ChatRelationAppList[jj].CHAT_ID == chatNum) {
                
                selectedAppList.push(ChatRelationAppList[jj].APP_ID);
            }
        }
    }

    for (var kk=0; kk<selectedAppList.length; kk++) {
        var tmpObj = new Object();
        tmpObj.appId = selectedAppList[kk];
        
        logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s] [앱 id : %s]', userId, 'luis/synchronizeLuis', 'luis app정보 조회 시작', selectedAppList[kk]);
        //tmpObj.intentList = syncClient.get(HOST + '/luis/api/v2.0/apps/' + selectedAppList[kk] + '/versions/' + '0.1' + '/intents', options);
        var tmpLuisObj = syncClient.get(HOST + '/luis/api/v2.0/apps/' + selectedAppList[kk] + '/versions/' + '0.1' + '/models?skip=0&take=1000', options);
        tmpObj.obj = luisUtil.getIntentEntityList(tmpLuisObj.body, selectedAppList[kk]);
        luisObj.push(tmpObj);
        logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s] [앱 id : %s]', userId, 'luis/synchronizeLuis', 'luis app정보 조회 완료', selectedAppList[kk]);
        //selectedIntentList.push(tmpObj);
    }
    
    //var intentListQry = "";

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'db Intent 조회 시작');
            
            let getDBIntent_result = await pool.request()
                                                .query("SELECT APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT, MOD_ID, MOD_DT FROM TBL_LUIS_INTENT");   
            var sessionIntentList = getDBIntent_result.recordset;
            //req.session.intentList = sessionIntentList;
            
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'intent 조회 완료, db Entity 조회 시작');
            let getDBEntity_result = await pool.request()
                                                .query("SELECT APP_ID, ENTITY_NAME, ENTITY_ID, REG_DT, MOD_DT FROM TBL_LUIS_ENTITY");     
            var sessionEntityList = getDBEntity_result.recordset;            
            //req.session.entityList = sessionEntityList;

            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'entity 조회 완료, db child entity 조회 시작');
            let getDBEntityChild_result = await pool.request()
                                                .query("SELECT ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST FROM TBL_LUIS_CHILD_ENTITY");      
            var sessionEntityChildList = getDBEntityChild_result.recordset;           
            //req.session.entityChildList = sessionEntityChildList;
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', ' db child entity 조회 완료');

            //db, luis 동기화 start
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'db-luis 동기화 시작');
            var intentListTotal = [];
            var entityListTotal = [];
            var childrenListTotal = [];
            for (var hh=0; hh<selectedAppList.length; hh++) {
                intentListTotal = intentListTotal.concat(luisObj[hh].obj.intentList);
                entityListTotal = entityListTotal.concat(luisObj[hh].obj.entityList);
                childrenListTotal = childrenListTotal.concat(luisObj[hh].obj.childrenList);
            }

            //var objLength =  ((intentListTotal.length>entityListTotal.length?intentListTotal.length:entityListTotal.length)>childrenListTotal.length?intentListTotal.length:childrenListTotal.length);
            
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'db-luis intent 비교');
            for (var jk=0; jk<intentListTotal.length; jk++) {
                for (var aj=0; aj<sessionIntentList.length; aj++) {
                    if (intentListTotal[jk].id == sessionIntentList[aj].INTENT_ID && intentListTotal[jk].name == sessionIntentList[aj].INTENT) {
                        sessionIntentList.splice(aj--, 1);
                        intentListTotal.splice(jk--, 1);
                        //sessionIntentList = sessionIntentList.splice(1+aj--, sessionIntentList.length);
                        //intentListTotal = intentListTotal.splice(1+jk--, intentListTotal.length);
                        break;
                    }
                }
            }

            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'db-luis entity 비교');
            for (var jk=0; jk<entityListTotal.length; jk++) {
                for (var aj=0; aj<sessionEntityList.length; aj++) {
                    if (entityListTotal[jk].id == sessionEntityList[aj].ENTITY_ID && entityListTotal[jk].name == sessionEntityList[aj].ENTITY_NAME) {
                        sessionEntityList.splice(aj--, 1);
                        entityListTotal.splice(jk--, 1);
                        //sessionEntityList = sessionEntityList.splice(1+aj--, sessionEntityList.length);
                        //entityListTotal = entityListTotal.splice(1+jk--, entityListTotal.length);
                        break;
                    }
                }
            }
            
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'db-luis child entity 비교');
            for (var jk=0; jk<childrenListTotal.length; jk++) {
                for (var aj=0; aj<sessionEntityChildList.length; aj++) {
                    if (childrenListTotal[jk].childId == sessionEntityChildList[aj].CHILDREN_ID && childrenListTotal[jk].name == sessionEntityChildList[aj].CHILDREN_NAME
                        && childrenListTotal[jk].entityId == sessionEntityChildList[aj].ENTITY_ID ) 
                    {
                        //5 : closed list
                        if (childrenListTotal[jk].typeId == 5) {
                            var subStrTmp = childrenListTotal[jk] == null ? null :childrenListTotal[jk];
                            if (sessionEntityChildList[aj].SUB_LIST == subStrTmp) {
                                sessionEntityChildList.splice(aj--, 1);
                                childrenListTotal.splice(jk--, 1);
                                break;
                            } 
                            else 
                            {
                                break;
                            }
                        }
                        else 
                        {
                            sessionEntityChildList.splice(aj--, 1);
                            childrenListTotal.splice(jk--, 1);
                            break;
                        }
                    }
                }
            }

            //db, luis 동기화 end
            //--------------------------intent start --------------------------
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'luis에 없고 db에 있는 intent db delete');
            for (var pp=0; pp<sessionIntentList.length; pp++) {
                var intentQry = "DELETE FROM TBL_LUIS_INTENT WHERE 1=1 AND APP_ID = @appId AND INTENT_ID = @intentId AND INTENT = @intent; \n ";

                //console.log("intent -" + pp)
                let delDBIntent = await pool.request()
                                                    .input('appId', sql.NVarChar, sessionIntentList[pp].APP_ID)
                                                    .input('intentId', sql.NVarChar, sessionIntentList[pp].INTENT_ID)
                                                    .input('intent', sql.NVarChar, sessionIntentList[pp].INTENT)
                                                    .query(intentQry);
            }

            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'luis에 있고 db에 없는 intent db insert');
            for (var pp=0; pp<intentListTotal.length; pp++) {
                var intentQry = "INSERT INTO TBL_LUIS_INTENT (APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT) \n ";
                intentQry += "VALUES(@appId, @intentName, @intentId, @reg_id, SWITCHOFFSET(getDate(), '+09:00')); ";

                //console.log("intent -" + pp)
                let insertDBIntent = await pool.request()
                                                    .input('appId', sql.NVarChar, intentListTotal[pp].appId)
                                                    .input('intentName', sql.NVarChar, intentListTotal[pp].name)
                                                    .input('intentId', sql.NVarChar, intentListTotal[pp].id)
                                                    .input('reg_id', sql.NVarChar, userId)
                                                    .query(intentQry);
            }
            //--------------------------intent end --------------------------

            //--------------------------entity start --------------------------
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'luis에 없고 db에 있는 entity db delete');
            for (var pp=0; pp<sessionEntityList.length; pp++) {
                var entityQry = "DELETE FROM TBL_LUIS_ENTITY WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId AND ENTITY_NAME = @entityName; \n ";

                //console.log("entity -" + pp)
                let delDBEntity = await pool.request()
                                                    .input('appId', sql.NVarChar, sessionEntityList[pp].APP_ID)
                                                    .input('entityId', sql.NVarChar, sessionEntityList[pp].ENTITY_ID)
                                                    .input('entityName', sql.NVarChar, sessionEntityList[pp].ENTITY_NAME)
                                                    .query(entityQry);
            }

            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'luis에 있고 db에 없는 entity db insert');
            for (var pp=0; pp<entityListTotal.length; pp++) {
                
                var entityQry = "INSERT INTO TBL_LUIS_ENTITY (APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT) \n ";
                entityQry += "VALUES(@appId, @entityName, @entityId, @entityType, SWITCHOFFSET(getDate(), '+09:00')); ";
                //console.log("entity -" + pp)
                let insertDBEntity = await pool.request()
                                                    .input('appId', sql.NVarChar, entityListTotal[pp].appId)
                                                    .input('entityName', sql.NVarChar, entityListTotal[pp].name)
                                                    .input('entityId', sql.NVarChar, entityListTotal[pp].id)
                                                    .input('entityType', sql.NVarChar, entityListTotal[pp].typeId)
                                                    .query(entityQry);
            }

            //--------------------------entity end --------------------------

            //--------------------------child Entity start --------------------------
            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'luis에 없고 db에 있는 child entity db delete');
            for (var pp=0; pp<sessionEntityChildList.length; pp++) {
                var childEntityQry = "DELETE FROM TBL_LUIS_CHILD_ENTITY WHERE 1=1 AND ENTITY_ID = @entityId AND CHILDREN_ID = @childId AND CHILDREN_NAME = @childName; \n ";

                //console.log("child -" + pp)
                let delDBChildEntity = await pool.request()
                                                    .input('entityId', sql.NVarChar, sessionEntityChildList[pp].ENTITY_ID)
                                                    .input('childId', sql.NVarChar, sessionEntityChildList[pp].CHILDREN_ID)
                                                    .input('childName', sql.NVarChar, sessionEntityChildList[pp].CHILDREN_NAME)
                                                    .query(childEntityQry);
            }

            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', 'luis에 있고 db에 없는 child entity db insert');
            for (var pp=0; pp<childrenListTotal.length; pp++) {
                //console.log("child -" + pp)
                if (childrenListTotal[pp].typeId != 5) {//composite, hierarchy
                    var childEntityQry = "INSERT INTO TBL_LUIS_CHILD_ENTITY (ENTITY_ID, CHILDREN_ID, CHILDREN_NAME) \n ";
                    childEntityQry += "VALUES(@entityId, @childId, @entityName ); ";

                    let insertDBChildEntity = await pool.request()
                                                        .input('entityId', sql.NVarChar, childrenListTotal[pp].entityId)
                                                        .input('childId', sql.NVarChar, childrenListTotal[pp].childId)
                                                        .input('entityName', sql.NVarChar, childrenListTotal[pp].name)
                                                        .query(childEntityQry);
                }
                else //closed list
                {
                    var childEntityQry = "INSERT INTO TBL_LUIS_CHILD_ENTITY (ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST) \n ";
                    childEntityQry += "VALUES(@entityId, @childId, @entityName, @childListStr); ";

                    let insertDBChildEntity = await pool.request()
                                                        .input('entityId', sql.NVarChar, childrenListTotal[pp].entityId)
                                                        .input('childId', sql.NVarChar, childrenListTotal[pp].childId)
                                                        .input('entityName', sql.NVarChar, childrenListTotal[pp].name)
                                                        .input('childListStr', sql.NVarChar, childrenListTotal[pp].childList)
                                                        .query(childEntityQry);
                }
            }
            //--------------------------child Entity start --------------------------

            //db에서 가져와서 session에 저장
            getDBIntent_result = await pool.request()
                                                .query("SELECT APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT, MOD_ID, MOD_DT FROM TBL_LUIS_INTENT ORDER BY CASE WHEN INTENT  LIKE '[0-9]%' THEN 3 WHEN INTENT like '[A-Za-z]%' THEN 1 ELSE 2 END, INTENT;");   
            req.session.intentList = getDBIntent_result.recordset;
            
            getDBEntity_result = await pool.request()
                                                .query("SELECT APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT, MOD_DT FROM TBL_LUIS_ENTITY ORDER BY ENTITY_TYPE, ENTITY_NAME;");        
            req.session.entityList = getDBEntity_result.recordset;

            getDBEntityChild_result = await pool.request()
                                                .query("SELECT ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST FROM TBL_LUIS_CHILD_ENTITY ORDER BY ENTITY_ID, CHILDREN_NAME;");              
            req.session.entityChildList = getDBEntityChild_result.recordset;

            /*
            //https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/0a66734d-690a-4877-9b4c-28ada8098751/versions/0.1/models/a8162515-d965-4d0c-9644-f77955a2b776/reviewLabels
            var utterList = [];
            var intentList = req.session.intentList;
            for (var iu=0; iu<intentList.length; iu++) {
                var utterListInIntent = [];
                var utterCnt = 0;
                var utterInfo = syncClient.get(HOST + '/luis/webapi/v2.0/apps/' + intentList[iu].APP_ID + '/versions/0.1/models/' + intentList[iu].INTENT_ID + '/reviewLabels', options)
                for (var jk=0; jk<utterInfo.body.length; jk++) {
                    var utterObj = new Object();
                    utterObj.id = utterInfo.body[jk].id;
                    utterObj.text = utterInfo.body[jk].text;
                    utterObj.tokenizedText = utterInfo.body[jk].tokenizedText;
                    utterObj.intentId = utterInfo.body[jk].intentId;
                    utterObj.intentLabel = utterInfo.body[jk].intentLabel;
                    utterObj.entityLabels = utterInfo.body[jk].entityLabels;
                    utterListInIntent.push(utterObj);
                    utterCnt++;
                }
                intentList[iu].UTTER_COUNT = utterCnt;
                utterList.push(utterListInIntent);
            }
            req.session.utterList = utterList;
            */

           //어터런스 cnt 
           //https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/0a66734d-690a-4877-9b4c-28ada8098751/versions/0.1/stats/labelsperintent
            var utterCntObj;
            var saveAppId = '';
            var intentList = req.session.intentList;
            for (var iu=0; iu<intentList.length; iu++) {
                if (saveAppId != intentList[iu].APP_ID) {
                    saveAppId = intentList[iu].APP_ID;
                    utterCntObj = syncClient.get(HOST + '/luis/webapi/v2.0/apps/' + saveAppId + '/versions/0.1/stats/labelsperintent', options);
                }
                
                for( var key in utterCntObj.body ) {
                    //console.log( key + '=>' + utterCntObj.body[key] );
                    if (key == intentList[iu].INTENT_ID) {
                        intentList[iu].UTTER_COUNT = utterCntObj.body[key];
                        break;
                    }
                }
                if (typeof intentList[iu].UTTER_COUNT=='undefined') {
                    intentList[iu].UTTER_COUNT = 0;
                }
                //intentList[iu].UTTER_CNT = utterCntObj.body.intentList[iu].INTENT_ID;
            }


            logger.info('[알림]동기화  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/synchronizeLuis', '동기화 종료');
            res.redirect('/board/dashBoard');
        } catch (err) {
            logger.info('[오류]동기화  [id : %s] [url : %s] [error : %s]', userId, 'luis/synchronizeLuis', err);
            res.render('error');
        } finally {
            sql.close();
        }
    })()
    
});

/*
--------------------------------------------------------
--  DDL for Table TB_LUIS_INTENT
--------------------------------------------------------

CREATE TABLE TB_LUIS_INTENT(
    APP_ID nvarchar(40) NOT NULL,
    INTENT nvarchar(40) NOT NULL,
    INTENT_ID nvarchar(40) NOT NULL,
    REG_ID nvarchar(50) NULL,
    REG_DT date NULL,
    MOD_ID nvarchar(50) NULL,
    MOD_DT date NULL
)
*/

/* GET users listing. */
router.get('/intentList', function (req, res) {

    var userId = req.session.sid;

    var selAppList = req.session.selChatInfo.chatbot.appList;
    if (typeof req.query.appIndex != 'undefined') {
        var appNumber = req.query.appIndex;
        var selApp = selAppList[appNumber];
        req.session.selAppId = selApp.APP_ID;
    }

    res.render('luis/intentList');
    /*
    var selectIntentQry = "";
    var selectedAppId = "";
    
    var leftList = req.session.leftList;
    var chatNum = -1;
    for (var ii = 0; ii< leftList.length; ii++) {
        if (leftList[ii].CHATBOT_NAME == req.session.appName) {
            chatNum = leftList[ii].CHATBOT_NUM;
            break;
        }
    }

    if (chatNum != -1) {
        var ChatRelationAppList = req.session.ChatRelationAppList;

        for (var jj = 0; jj< ChatRelationAppList.length; jj++) {
            if (ChatRelationAppList[jj].CHAT_ID == chatNum) {
                selectedAppId = ChatRelationAppList[jj].APP_ID;
                break;
            }
        }
    }

    if (selectedAppId == '') {
        logger.info('[오류]인텐트 리스트 조회 [id : %s] [url : %s] [error : %s]', userId, 'luis/intentList', '앱 ID조회 실패');
        res.render('error');
    }
    else
    {
        selectIntentQry += " SELECT APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT, MOD_ID, MOD_DT  \n";
        selectIntentQry += "   FROM TBL_LUIS_INTENT \n";
        selectIntentQry += "  WHERE APP_ID = @appId; ";

        (async () => {
            try {
                let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

                //var luisId = req.body.luisId;

                let getDBIntent_result = await pool.request()
                                                    .input('appId', sql.NVarChar, selectedAppId)
                                                    .query(selectIntentQry);
                let intentList = getDBIntent_result.recordset;

                req.session.intentList = intentList;
                
                res.render('luis/intentList', {'intentList' : intentList});

            } catch (err) {
                logger.info('[오류]인텐트 리스트 조회 [id : %s] [url : %s] [error : %s]', userId, 'luis/intentList', err);
                res.render('error');
            } finally {
                sql.close();
            }
        })()
    }
    */
});

router.post('/selectIntentList', function (req, res) {

    var userId = req.session.sid;
    var selAppId = req.session.selAppId;
    var searchIntent = req.body.searchIntent == undefined ? '':req.body.searchIntent;
    var selPage = req.body.selPage;

    var intentList = req.session.intentList.slice();

    for (var i=0; i<intentList.length; i++) {
        //APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE
        var chkIntent = false;
        if (intentList[i].APP_ID != selAppId) {
            chkIntent = true;
        }
        else 
        {
            if (searchIntent != '') {
                if (intentList[i].INTENT.toUpperCase().indexOf(searchIntent.toUpperCase()) == -1) {
                    chkIntent = true;
                }   
            }
        }
        if (chkIntent) intentList.splice(i--, 1);
    }

    if(intentList.length > 0){
        var listLength = intentList.length;
        var pageStartInex = 0;
        if ((selPage-1)*10 > listLength) {
            intentList = intentList.splice(0, listLength<11?listLength:10);
        }
        else {
            intentList = intentList.splice((selPage-1)*10, 10);
        }
        res.send({intentList : intentList, pageList : paging.pagination(selPage, listLength)});
    } else {
        res.send({intentList : intentList});
    }
});

router.post('/createIntent', function (req, res) {
    try 
    {
        var userId = req.session.sid;
        var intentName = req.body.intentName;

        var intentList = req.session.intentList.slice();
        var selAppList = req.session.selChatInfo.chatbot.appList;

        var dupleRst = false;
        var existIndex = -1;

        var tmpLuisObj;
        var intentId;
        var createIntentQry = "";

        if (!dupleRst) {
            for (var i=0; i<intentList.length; i++) {
                if (intentName.toUpperCase() == intentList[i].INTENT.toUpperCase()) {
                    dupleRst = true;
                    for (var i=0; i<selAppList.length; i++) {
                        if (selAppList[i].APP_ID == intentList[i].APP_ID) {
                            existIndex = i+1;
                            break;
                        }
                    }
                    break;
                }
            }
        }
        //중복 존재
        if (dupleRst) 
        {
            res.send({dupleRst : dupleRst, existApp : req.session.appName + " " + existIndex});
        }
        else 
        {
            options.payload = { "name": intentName };
            tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/intents', options);

            if (tmpLuisObj.statusCode == 201) {
                intentId = tmpLuisObj.body;

                createIntentQry = "  INSERT INTO TBL_LUIS_INTENT (APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT) \n";
                createIntentQry += " VALUES(@appId, @intentName, @intentId, @reg_id, SWITCHOFFSET(getDate(), '+09:00'));  ";
                    
                try {
                    (async () => {
                        let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                        let insertDBIntent = await pool.request()
                                                        .input('appId', sql.NVarChar, req.session.selAppId)
                                                        .input('intentName', sql.NVarChar, intentName)
                                                        .input('intentId', sql.NVarChar, intentId)
                                                        .input('reg_id', sql.NVarChar, userId)
                                                        .query(createIntentQry);
                        
                        
                        let getDBIntent_result = await pool.request()
                                                        .query("SELECT APP_ID, INTENT, INTENT_ID, REG_ID, REG_DT, MOD_ID, MOD_DT FROM TBL_LUIS_INTENT ORDER BY CASE WHEN INTENT  LIKE '[0-9]%' THEN 3 WHEN INTENT like '[A-Za-z]%' THEN 1 ELSE 2 END, INTENT;");   
                        req.session.intentList = getDBIntent_result.recordset;
                        
                        var utterCntObj;
                        var saveAppId = '';
                        var intentList = req.session.intentList;
                        for (var iu=0; iu<intentList.length; iu++) {
                            if (saveAppId != intentList[iu].APP_ID) {
                                saveAppId = intentList[iu].APP_ID;
                                utterCntObj = syncClient.get(HOST + '/luis/webapi/v2.0/apps/' + saveAppId + '/versions/0.1/stats/labelsperintent', options);
                            }
                            
                            for( var key in utterCntObj.body ) {
                                //console.log( key + '=>' + utterCntObj.body[key] );
                                if (key == intentList[iu].INTENT_ID) {
                                    intentList[iu].UTTER_COUNT = utterCntObj.body[key];
                                    break;
                                }
                            }
                            if (typeof intentList[iu].UTTER_COUNT=='undefined') {
                                intentList[iu].UTTER_COUNT = 0;
                            }
                            //intentList[iu].UTTER_CNT = utterCntObj.body.intentList[iu].INTENT_ID;
                        }


                        logger.info('[알림]Intent 생성  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createIntent', '[' + intentName + '] 생성');
                        res.send({success : true});
                        
                    })()
                    
                } catch(e) {
                    throw new Error(e.message);
                } finally {
                    sql.close();
                }
            }
            else if (tmpLuisObj.statusCode == 429) {
                logger.info('[에러]루이스 Intent 생성 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createIntent',  'timeout!');
                res.send({success : false, message : '시간초과 입니다. 문제가 계속되면 관리자에게 문의하세요.'});

            } else if (tmpLuisObj.statusCode == 400 || tmpLuisObj.statusCode == 401) {
                if (tmpLuisObj.body.error) {
                    var resultCode = tmpLuisObj.body.error.code;
                    var resultStr = tmpLuisObj.body.error.message;
                    logger.info('[에러]루이스 Intent 생성 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createIntent',  resultCode + ' : ' + resultStr);
                    res.send({success : false, message : 'Intent 생성에 문제가 발생했습니다. 관리자에게 문의해주세요.'});
                }
            }
        }
    } 
    catch(err) 
    {
        logger.info('[에러]인텐트 생성  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createIntent', err.message);
        res.send({error : true, message : '이상이 생겼습니다. 관리자에게 문의해주세요.'});
    }
    
});


router.post('/deleteIntent', function (req, res) {

    var userId = req.session.sid;
    var deleteIntentName = req.body.deleteIntentName;
    var deleteIntentId = req.body.deleteIntentId;
    var intentList = req.session.intentList;
    var deleteIntentQry = "";
    var tmpLuisObj;
    try {

        tmpLuisObj = syncClient.del(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/intents/' + deleteIntentId, options);
            
        if (tmpLuisObj.statusCode == 200) {
            deleteIntentQry = " DELETE FROM TBL_LUIS_INTENT \n";
            deleteIntentQry += " WHERE 1=1 AND APP_ID = @appId AND INTENT_ID = @deleteIntentId; ";

            try {
                (async () => {
                    let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                    let deleteEntityRst = await pool.request()
                                                        .input('appId', sql.NVarChar, req.session.selAppId)
                                                        .input('deleteIntentId', sql.NVarChar, deleteIntentId)
                                                        .query(deleteIntentQry);

                    //session삭제
                    for (var q=0; q<intentList.length; q++) {
                        if (intentList[q].APP_ID == req.session.selAppId && intentList[q].INTENT_ID == deleteIntentId) {
                            intentList.splice(q--, 1);
                            break;
                        }
                    } 
/*
                    deleteChildEntityQry = " DELETE FROM TBL_LUIS_CHILD_ENTITY \n ";
                    deleteChildEntityQry += " WHERE 1=1 AND ENTITY_ID = @entityId; ";

                    let deleteDBChildEntity = await pool.request()
                                                        .input('entityId', sql.NVarChar, deleteEntityId)
                                                        .query(deleteChildEntityQry);
                    
                    //session삭제
                    for (var p=0; p<childList.length; p++) {
                        if (childList[p].ENTITY_ID == deleteEntityId) {
                            childList.splice(p--, 1);    
                        }
                    } 
                    
*/
                    logger.info('[알림]Intent 삭제  [id : %s] [url : %s] [이름 : %s] [intentId : %s]', userId, 'luis/deleteIntent', '[' + deleteIntentName + '] 삭제', deleteIntentId);
                    res.send({success : true, message : '삭제했습니다.'});
                    
                })()
                
            } catch(e) {
                throw new Error(e.message);
            } finally {
                sql.close();
            }
        }
        else if (tmpLuisObj.statusCode == 429) {
            logger.info('[에러]루이스 엔티티 삭제 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/deleteEntity',  'timeout!');
            res.send({success : false, message : '시간초과 입니다. 문제가 계속되면 관리자에게 문의하세요.'});

        } 
        else if (tmpLuisObj.statusCode == 400 || tmpLuisObj.statusCode == 401) {
            if (tmpLuisObj.body.error) {
                var resultCode = tmpLuisObj.body.error.code;
                var resultStr = tmpLuisObj.body.error.message;
                logger.info('[에러]루이스 인텐트 삭제 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/deleteEntity',  resultCode + ' : ' + resultStr);
                res.send({success : false, message : '인텐트 삭제중 문제가 발생했습니다. 관리자에게 문의해주세요.'});
            }
        }
    } catch(e) {
        logger.info('[에러]루이스 인텐트 삭제 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/deleteIntent', e.message);
        res.send({error : true, message : '루이스 인텐트 삭제 실패 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
});

router.post('/getUtterInIntent', function (req, res) {

    var userId = req.session.sid;
    var intentName = req.body.intentName;
    var intentId = req.body.intentId;
    var lebelCnt = req.body.lebelCnt;
    if (lebelCnt == '0') {
        lebelCnt = '1';
    }

    var intentList = req.session.intentList;

    var utterInfo;
    var utterPrediction;

    try {
        //https://westus.api.cognitive.microsoft.com/luis/webapi/v2.0/apps/0a66734d-690a-4877-9b4c-28ada8098751/versions/0.1/models/a8162515-d965-4d0c-9644-f77955a2b776/reviewLabels
        
        var utterList = [];
        if (typeof req.session.utterList != 'undefined') {
            utterList = req.session.utterList;
        }
        var chkSuccess = false;
        for (var iu=0; iu<intentList.length; iu++) {
            if (intentList[iu].INTENT_ID == intentId) {
                var utterObj1 = new Object();
                var utterListInIntent = [];
                utterInfo = syncClient.get(HOST + '/luis/webapi/v2.0/apps/' + intentList[iu].APP_ID + '/versions/0.1/models/' + intentList[iu].INTENT_ID + '/reviewLabels?skip=0&take=' + lebelCnt , options);
                if (utterInfo.statusCode == 200) {
                    utterPrediction = syncClient.get(HOST + '/luis/webapi/v2.0/apps/' + intentList[iu].APP_ID + '/versions/0.1/models/' + intentList[iu].INTENT_ID + '/reviewPredictions?skip=0&take=' + lebelCnt , options);
                
                    chkSuccess = true;
                    for (var jk=0; jk<utterInfo.body.length; jk++) {
                        var utterObj2 = new Object();
                        utterObj2.id = utterInfo.body[jk].id;
                        utterObj2.text = utterInfo.body[jk].text;
                        utterObj2.tokenizedText = utterInfo.body[jk].tokenizedText;
                        utterObj2.intentId = utterInfo.body[jk].intentId;
                        utterObj2.intentLabel = utterInfo.body[jk].intentLabel;
                        /*
                        var entityLabels = [];
                        for (var yu=0; yu<utterInfo.body[jk].entityLabels.length; yu++) {
                            var tmpObj = new Object();
                            tmpObj.id = utterInfo.body[jk].entityLabels[yu].id;
                            tmpObj.entityName = utterInfo.body[jk].entityLabels[yu].entityName;
                            tmpObj.startTokenIndex = utterInfo.body[jk].entityLabels[yu].startTokenIndex;
                            tmpObj.endTokenIndex = utterInfo.body[jk].entityLabels[yu].endTokenIndex;
                            tmpObj.entityType = utterInfo.body[jk].entityLabels[yu].entityType;
                            entityLabels.push(tmpObj);
                        }
                        if (utterPrediction.body[jk].entityPredictions.length > 0) {
                            for (var yu=0; yu<utterPrediction.body[jk].entityPredictions.length; yu++) {
                                var tmpObj = new Object();
                                tmpObj.id = utterPrediction.body[jk].entityPredictions[yu].id;
                                tmpObj.entityName = utterPrediction.body[jk].entityPredictions[yu].entityName;
                                tmpObj.startTokenIndex = utterPrediction.body[jk].entityPredictions[yu].startTokenIndex;
                                tmpObj.endTokenIndex = utterPrediction.body[jk].entityPredictions[yu].endTokenIndex;
                                tmpObj.entityType = utterPrediction.body[jk].entityPredictions[yu].entityType;
                                tmpObj.phrase = utterPrediction.body[jk].entityPredictions[yu].phrase;
                                entityLabels.push(tmpObj);
                            }
                        } 
                        */
                        utterObj2.entityLabels = utterPrediction.body[jk].entityPredictions;
                        utterObj2.intentScore = utterPrediction.body[jk].intentPredictions;
                        utterListInIntent.push(utterObj2);
                    }
                    var updateIndex = -1;
                    for (var tk=0; tk<utterList.length; tk++) {
                        if (utterList[tk].INTENT_ID == intentList[iu].INTENT_ID) {
                            updateIndex = tk;
                            break;
                        }
                    }
                    if (updateIndex == -1) {
                        utterObj1.INTENT_ID = intentList[iu].INTENT_ID;
                        utterObj1.UTTER_LIST = utterListInIntent;
                        utterList.push(utterObj1);
                    }
                    else {
                        utterObj1.INTENT_ID = intentList[iu].INTENT_ID;
                        utterObj1.UTTER_LIST = utterListInIntent;
                        utterList[updateIndex] = utterObj1;
                    }
                    req.session.utterList = utterList;
                    break;
                }
                else {
                    chkSuccess = false;
                    break;
                }
                
            }
        }
        if (chkSuccess) {
            res.send({success : true});
        }
        else {
            if (tmpLuisObj.body.error) {
                var resultCode = utterInfo.body.error.code;
                var resultStr = utterInfo.body.error.message;
                logger.info('[에러]intent의 utterance 조회 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/getUtterInIntent',  resultCode + ' : ' + resultStr);
                res.send({success : false, message : 'intent의 utterance 조회중 문제가 발생했습니다. 관리자에게 문의해주세요.'});
            }
        }
            
    } catch(e) {
        logger.info('[에러]intent의 utterance 조회 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/getUtterInIntent', e.message);
        res.send({error : true, message : 'intent의 utterance 조회 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
            
});




router.get('/intentDetail', function (req, res) {
    
    //var userId = req.session.sid;
    var intentName = req.query.intentName;
    var intentId = req.query.intentId;
    var labelCnt = req.query.labelCnt;


    res.render('luis/intentDetail', {'intentName' : intentName, 'intentId' : intentId, 'labelCnt' : labelCnt});
    
});

router.post('/selectUtterList', function (req, res) {
    
    var userId = req.session.sid;
    var intentName = req.body.intentName;
    var intentId = req.body.intentId;
    var selPage = req.body.selPage;

    var utterList = req.session.utterList;
    var returnObj = new Object();
    var returnArr = [];
    try {
        //utterObj1.INTENT_ID = intentList[iu].INTENT_ID;
        //utterObj1.UTTER_LIST = utterListInIntent;
        /*
        utterObj2.id = utterInfo.body[jk].id;
        utterObj2.text = utterInfo.body[jk].text;
        utterObj2.tokenizedText = utterInfo.body[jk].tokenizedText;
        utterObj2.intentId = utterInfo.body[jk].intentId;
        utterObj2.intentLabel = utterInfo.body[jk].intentLabel;
        utterObj2.entityLabels = utterInfo.body[jk].entityLabels;
        utterListInIntent.push(utterObj2);
        */
        
        for (var iu=0; iu<utterList.length; iu++) {
            if (utterList[iu].INTENT_ID == intentId) {
                //returnObj = utterList[iu];
                returnArr = utterList[iu].UTTER_LIST.slice();
                break;
            }
        }
        if(returnArr.length > 0){
            var listLength = returnArr.length;
            var pageStartInex = 0;
            if ((selPage-1)*10 > listLength) {
                returnObj.UTTER_LIST = returnArr.splice(0, listLength<11?listLength:10);
            }
            else {
                returnObj.UTTER_LIST = returnArr.splice((selPage-1)*10, 10);
            }
            res.send({utterObj : returnObj, pageList : paging.pagination(selPage, listLength)});
        } else {
            res.send({utterObj : returnObj});
        }
        
    } catch (e) {
        logger.info('[에러]어터런스 조회  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/selectUtterList',  e.message);
        res.send({error : true, message : '이상이 생겼습니다. 관리자에게 문의해주세요.'});
    }
});

router.post('/getEntityList', function (req, res) {
    
    var userId = req.session.sid;

    var entityList = req.session.entityList.slice();
    var childList = req.session.entityChildList;

    var simpleList = [];
    var hierarchyList = [];
    var compositeList = [];
    var closedList = [];
    try {
        for (var i=0; i<entityList.length; i++) {
            var editChild = [];
            switch(entityList[i].ENTITY_TYPE) {
                case '1':
                    //'Simple';
                    simpleList.push(entityList[i]);
                    break;
                case '2':
                    //'Prebuilt';
                    break;
                case '3':
                    //'Hierarchical';
                    for (var j=0; j<childList.length; j++) {
                        if (entityList[i].ENTITY_ID == childList[j].ENTITY_ID) {
                            editChild.push(childList[j]);
                        }
                    }
                    entityList[i].CHILD_ENTITY_LIST = editChild;
                    hierarchyList.push(entityList[i]);

                    break;
                case '4':
                    //'Composite';
                    for (var j=0; j<childList.length; j++) {
                        if (entityList[i].ENTITY_ID == childList[j].ENTITY_ID) {
                            editChild.push(childList[j]);
                        }
                    }
                    entityList[i].CHILD_ENTITY_LIST = editChild;
                    compositeList.push(entityList[i]);
                    break;
                case '5':
                    //'Closed List';
                    for (var j=0; j<childList.length; j++) {
                        if (entityList[i].ENTITY_ID == childList[j].ENTITY_ID) {
                            editChild.push(childList[j]);
                        }
                    }
                    entityList[i].CHILD_ENTITY_LIST = editChild;
                    closedList.push(entityList[i]);
                    break;
                default:
                    //'None';
                    break;
            }
        }
         
        res.send({simpleList : simpleList, hierarchyList : hierarchyList, compositeList : compositeList, closedList : closedList});
       
        
    } catch (e) {
        logger.info('[에러]엔티티 리스트 조회  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/getEntityList',  e.message);
        res.send({error : true, message : '이상이 생겼습니다. 관리자에게 문의해주세요.'});
    }
});

/* GET users listing. */
router.get('/entityList', function (req, res) {

    var userId = req.session.sid;
    var selectIntentQry = "";
    var selectedAppList = [];
    var selectedIntentList = [];
    
    var leftList = req.session.leftList;
    var chatNum = -1;

    var selAppList = req.session.selChatInfo.chatbot.appList;
    if (typeof req.query.appIndex != 'undefined') {
        var appNumber = req.query.appIndex;
        var selApp = selAppList[appNumber];
        req.session.selAppId = selApp.APP_ID;
    }

    /*
    var  selEntityQry = "";
    selEntityQry += "SELECT APP_ID, ENTITY_NAME,  ENTITY_ID, ENTITY_TYPE \n";
    selEntityQry += "  FROM TBL_LUIS_ENTITY \n";
    selEntityQry += " WHERE APP_ID = @appId; ";
    
    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);

            var luisId = req.body.luisId;

            let getDBIntent_result = await pool.request()
                                                .input('appId', sql.NVarChar, selApp.APP_ID)
                                                .query(selEntityQry);
            let intentList = getDBIntent_result.recordset;
        }
        catch(e) {

        }
    })();
    */
    res.render('luis/entityList');

});


router.post('/selectEntityList', function (req, res) {

    var userId = req.session.sid;
    var selAppId = req.session.selAppId;
    var searchEntity = req.body.searchEntity == undefined ? '':req.body.searchEntity;
    var entityType = req.body.entityType;
    var selPage = req.body.selPage;

    //var entityList1 = req.session.entityList.slice(0, req.session.entityList.length);
    //var entityList2 = req.session.entityList.slice(0);
    var entityList = req.session.entityList.slice();

    for (var i=0; i<entityList.length; i++) {
        //APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE
        var chkEntity = false;
        if (entityList[i].APP_ID != selAppId) {
            chkEntity = true;
        }
        else 
        {
            if (entityType == 'ALL') {
                if (searchEntity != '') {
                    if (entityList[i].ENTITY_NAME.toUpperCase().indexOf(searchEntity.toUpperCase()) == -1) {
                        chkEntity = true;
                    }   
                }
            } 
            else 
            {
                if (entityType != entityList[i].ENTITY_TYPE) {
                    chkEntity = true;
                } else {
                    if (searchEntity != '') {
                        if (entityList[i].ENTITY_NAME.toUpperCase().indexOf(searchEntity.toUpperCase()) == -1) {
                            chkEntity = true;
                        }   
                    }
                }
            }
        }
        if (chkEntity) entityList.splice(i--, 1);
    }

    if(entityList.length > 0){
        var listLength = entityList.length;
        var pageStartInex = 0;
        if ((selPage-1)*10 > listLength) {
            entityList = entityList.splice(0, listLength<11?listLength:10);
        }
        else {
            entityList = entityList.splice((selPage-1)*10, 10);
        }
        res.send({entityList : entityList, pageList : paging.pagination(selPage, listLength)});
    } else {
        res.send({entityList : entityList});
    }
});


router.post('/createEntity', function (req, res) {
    try 
    {
        var userId = req.session.sid;
        var entityName = req.body.entityName;
        var entityType = req.body.entityType;
        var childEntityArr;
        /*
        if (req.body['childEntityList[]']) {
            childEntityArr = req.body['childEntityList[]'];
        }
        */
        childEntityArr = req.body['childEntityList[]']==undefined?req.body.chilEntityList:req.body['childEntityList[]'];
        //var entityList1 = req.session.entityList.slice(0, req.session.entityList.length);
        //var entityList2 = req.session.entityList.slice(0);
        var entityList = req.session.entityList.slice();
        var childList = req.session.entityChildList;
        var selAppList = req.session.selChatInfo.chatbot.appList;

        var dupleRst = false;
        var existEntity = "";
        var existIndex = -1;

        var tmpLuisObj;
        var childEntityLuis;
        var entityId = "";

        var createEntityQry = "";
        var createChildEntityQry = "";

        //child List 중복체크
        if (typeof childEntityArr != "undefined") {
            for (var ce=0; ce<childList.length; ce++) {
                for (dd=0; dd<childEntityArr.length; dd++) {
                    if (childList[ce].CHILDREN_NAME == childEntityArr[dd]) {
                        dupleRst = true;
                        existEntity = childList[ce].CHILDREN_NAME;
                    }
                }
            }
        }


        if (!dupleRst) {
            for (var i=0; i<entityList.length; i++) {
                if (entityName == entityList[i].ENTITY_NAME) {
                    dupleRst = true;
                    for (var i=0; i<selAppList.length; i++) {
                        if (selAppList[i].APP_ID == entityList[i].APP_ID) {
                            existIndex = i+1;
                            break;
                        }
                    }
                    break;
                }
            }
        }
        //중복 존재
        if (dupleRst) 
        {
            if (existIndex == -1) {
                res.send({dupleRst : dupleRst, existEntity : existEntity });
            }
            else {
                res.send({dupleRst : dupleRst, existApp : req.session.appName + " " + existIndex});
            }
        }
        else 
        {
            switch (entityType) { 
                case "1"://"readableType": "Entity Extractor",
                    options.payload = { "name": entityName };
                    tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/entities', options);
                    break;
                /*
                case "2"://"readableType": "Entity Extractor",
                x.appId = appId;
                entityList.push(x);
                break;
                */
                case "3"://"Hierarchical Entity Extractor",
                    options.payload = { 
                        "name": entityName,
                        "children" : childEntityArr
                    };
                    tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/hierarchicalentities', options);
                    break;

                case "4"://"readableType": "Composite Entity Extractor",
                    options.payload = { 
                        "name": entityName,
                        "children" : childEntityArr
                    };
                    tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/compositeentities', options);
                    break;

                case "5"://"readableType": "Closed List Entity Extractor",
                    options.payload = { 
                        "name": entityName,
                        "sublists": []
                    };
                    tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/closedlists', options);
                    break;
                default :
                    throw new Error("entity Type Error, input Type : " + entityType);
            }

            if (tmpLuisObj.statusCode == 201) {
                entityId = tmpLuisObj.body;

                switch (entityType) { 
                    case "1"://"readableType": "Entity Extractor",
                        createEntityQry = "  INSERT INTO TBL_LUIS_ENTITY (APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT) \n";
                        createEntityQry += " VALUES (@appId, @entityName, @entityId, @entityType, SWITCHOFFSET(getDate(), '+09:00')); ";
                        break;
                    /*
                    case "2"://"readableType": "Entity Extractor",
                    break;
                    */
                    case "3"://"Hierarchical Entity Extractor",
                        createEntityQry = "  INSERT INTO TBL_LUIS_ENTITY (APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT) \n";
                        createEntityQry += " VALUES (@appId, @entityName, @entityId, @entityType, SWITCHOFFSET(getDate(), '+09:00')); ";
                        break;

                    case "4"://"readableType": "Composite Entity Extractor",
                        createEntityQry = "  INSERT INTO TBL_LUIS_ENTITY (APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT) \n";
                        createEntityQry += " VALUES (@appId, @entityName, @entityId, @entityType, SWITCHOFFSET(getDate(), '+09:00')); ";
                        break;

                    case "5"://"readableType": "Closed List Entity Extractor",
                        createEntityQry = "  INSERT INTO TBL_LUIS_ENTITY (APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT) \n";
                        createEntityQry += " VALUES (@appId, @entityName, @entityId, @entityType, SWITCHOFFSET(getDate(), '+09:00')); ";
                        break;
                }

                try {
                    (async () => {
                        let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                        let insertEntityRst = await pool.request()
                                                            .input('appId', sql.NVarChar, req.session.selAppId)
                                                            .input('entityName', sql.NVarChar, entityName)
                                                            .input('entityId', sql.NVarChar, entityId)
                                                            .input('entityType', sql.NVarChar, entityType)
                                                            .query(createEntityQry);
                        if (entityType == "3" || entityType == "4") {
                            if (entityType == "3") {
                                childEntityLuis = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/hierarchicalentities/' + entityId, options);
                            }
                            else if (entityType == "4") {
                                childEntityLuis = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/compositeentities/' + entityId, options);
                            }

                            if (childEntityLuis.statusCode == 201) {
                                var childEntityList = luisUtil.getChildEntityList(tmpLuisObj.body);
                                for (var ic=0; ic<childEntityList.length; ic++) {
                                    createChildEntityQry = "INSERT INTO TBL_LUIS_CHILD_ENTITY (ENTITY_ID, CHILDREN_ID, CHILDREN_NAME) \n ";
                                    createChildEntityQry += "VALUES(@entityId, @childId, @entityName ); ";

                                    let insertDBChildEntity = await pool.request()
                                                                        .input('entityId', sql.NVarChar, childEntityList[ic].entityId)
                                                                        .input('childId', sql.NVarChar, childEntityList[ic].childId)
                                                                        .input('entityName', sql.NVarChar, childEntityList[ic].name)
                                                                        .query(createChildEntityQry);
                                }
                            }
                            else 
                            {
                                var resultCode = childEntityLuis.body.error.code;
                                var resultStr = childEntityLuis.body.error.message;
                                logger.info('[에러]루이스 child Entity 조회  [id : %s] [url : %s] [error : %s] [내용 : %s]', userId, 'luis/createEntity',  resultCode + ' : ' + resultStr, '방금 생성한 엔티티의 child entity목록을 가져오는데 실패했습니다.');
                                res.send({success : false, message : '엔티티 조회에 실패했습니다. 앱 목록에서 다시 챗봇을 선택해 주세요.'});
                            }
                        }


                        //session 수정
                        let getDBEntity_result = await pool.request()
                                                    .query("SELECT APP_ID, ENTITY_NAME, ENTITY_ID, ENTITY_TYPE, REG_DT, MOD_DT FROM TBL_LUIS_ENTITY ORDER BY ENTITY_TYPE, ENTITY_NAME;");     
                        req.session.entityList = getDBEntity_result.recordset; 

                        let getDBEntityChild_result = await pool.request()
                                                            .query("SELECT ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST FROM TBL_LUIS_CHILD_ENTITY");              
                        req.session.entityChildList = getDBEntityChild_result.recordset;


                        logger.info('[알림]Entity 생성  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createEntity', '[' + entityName + '] 생성');
                        res.send({success : true});
                        
                    })()
                    
                } catch(e) {
                    throw new Error(e.message);
                } finally {
                    sql.close();
                }
            }
            else if (tmpLuisObj.statusCode == 429) {
                logger.info('[에러]루이스 엔티티 생성 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createEntity',  'timeout!');
                res.send({success : false, message : '시간초과 입니다. 문제가 계속되면 관리자에게 문의하세요.'});

            } else if (tmpLuisObj.statusCode == 400 || tmpLuisObj.statusCode == 401) {
                if (tmpLuisObj.body.error) {
                    var resultCode = tmpLuisObj.body.error.code;
                    var resultStr = tmpLuisObj.body.error.message;
                    logger.info('[에러]루이스 엔티티 생성 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createEntity',  resultCode + ' : ' + resultStr);
                    res.send({success : false, message : '엔티티 생성에 문제가 발생했습니다. 관리자에게 문의해주세요.'});
                }
            }
        }
    } 
    catch(err) 
    {
        logger.info('[에러]엔티티생성  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/createEntity', err.message);
        res.send({error : true, message : '이상이 생겼습니다. 관리자에게 문의해주세요.'});
    }
    
});


router.post('/selectChildCompositeList', function (req, res) {

    var userId = req.session.sid;
    var selAppId = req.session.selAppId;
    var entityList = req.session.entityList.slice();
    var childList = req.session.entityChildList.slice();
    //var selAppList = req.session.selChatInfo.chatbot.appList;

    try {
        var childCompositeList = [];
        for (var i=0; i<entityList.length; i++) {
            if (selAppId == entityList[i].APP_ID && entityList[i].ENTITY_TYPE != "4") {//composite -4 제외
                var inputHierarchy = [];
                if (entityList[i].ENTITY_TYPE == "3") {

                    for (var k=0; k<childList.length; k++) {
                        if (childList[k].ENTITY_ID == entityList[i].ENTITY_ID) {
                            inputHierarchy.push( entityList[i].ENTITY_NAME + "::" + childList[k].CHILDREN_NAME)
                        }
                    }
                    /*
                    childList.find(function(element) {
                        if (element.ENTITY_ID == entityList[i].ENTITY_ID) {
                            inputHierarchy.push( entityList[i].ENTITY_NAME + "::" + element.CHILDREN_NAME)
                        }
                    });
                    */
                    inputHierarchy.forEach(function(element) {
                        childCompositeList.push(element);
                    });
                } else {
                    childCompositeList.push(entityList[i].ENTITY_NAME);
                }
            }
        }
        res.send({success : true, childCompositeList : childCompositeList});
    } catch(e) {
        logger.info('[에러]composite child List조회  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/selectChildCompositeList', e.message);
        res.send({error : true, message : 'Composite child List조회 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
    //finally {}
});






router.post('/deleteEntity', function (req, res) {

    var userId = req.session.sid;
    var deleteEntityName = req.body.deleteEntityName;
    var deleteEntityId = req.body.deleteEntityId;
    var deleteEntityType = req.body.deleteEntityType;

    var entityList = req.session.entityList;
    var childList = req.session.entityChildList;

    var deleteEntityQry = "";
    var deleteChildEntityQry = "";
    var tmpLuisObj;
    try {
        
        switch (deleteEntityType) { 
            case "1"://"readableType": "Entity Extractor",
                tmpLuisObj = syncClient.del(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/entities/' + deleteEntityId, options);
                break;
            /*
            case "2"://"readableType": "Entity Extractor",
                break;
            */
            case "3"://"Hierarchical Entity Extractor",
                tmpLuisObj = syncClient.del(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/hierarchicalentities/' + deleteEntityId, options);
                break;

            case "4"://"readableType": "Composite Entity Extractor",
                tmpLuisObj = syncClient.del(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/compositeentities/' + deleteEntityId, options);
                break;

            case "5"://"readableType": "Closed List Entity Extractor",
                tmpLuisObj = syncClient.del(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/closedlists/' + deleteEntityId, options);
                break;
            default :
                throw new Error("entity Type Error, input Type : " + entityType);
        }

        if (tmpLuisObj.statusCode == 200) {
            switch (deleteEntityType) { 
                case "1"://"readableType": "Entity Extractor",
                    deleteEntityQry = " DELETE FROM TBL_LUIS_ENTITY \n";
                    deleteEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;
                /*
                case "2"://"readableType": "Entity Extractor",
                break;
                */
                case "3"://"Hierarchical Entity Extractor",
                    deleteEntityQry = " DELETE FROM TBL_LUIS_ENTITY \n";
                    deleteEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;

                case "4"://"readableType": "Composite Entity Extractor",
                    deleteEntityQry = " DELETE FROM TBL_LUIS_ENTITY \n";
                    deleteEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;

                case "5"://"readableType": "Closed List Entity Extractor",
                    deleteEntityQry = " DELETE FROM TBL_LUIS_ENTITY \n";
                    deleteEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;
            }

            try {
                (async () => {
                    let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                    let deleteEntityRst = await pool.request()
                                                        .input('appId', sql.NVarChar, req.session.selAppId)
                                                        .input('entityId', sql.NVarChar, deleteEntityId)
                                                        .query(deleteEntityQry);

                    //session삭제
                    for (var q=0; q<entityList.length; q++) {
                        if (entityList[q].APP_ID == req.session.selAppId && entityList[q].ENTITY_ID == deleteEntityId) {
                            entityList.splice(q--, 1);
                            break;
                        }
                    } 

                    if (deleteEntityType == "3" || deleteEntityType == "4" || deleteEntityType == "5") {
                        deleteChildEntityQry = " DELETE FROM TBL_LUIS_CHILD_ENTITY \n ";
                        deleteChildEntityQry += " WHERE 1=1 AND ENTITY_ID = @entityId; ";

                        let deleteDBChildEntity = await pool.request()
                                                            .input('entityId', sql.NVarChar, deleteEntityId)
                                                            .query(deleteChildEntityQry);
                        
                        //session삭제
                        for (var p=0; p<childList.length; p++) {
                            if (childList[p].ENTITY_ID == deleteEntityId) {
                                childList.splice(p--, 1);    
                            }
                        } 
                        /*
                        await childList.find(function(element, index){
                            if (element.ENTITY_ID == deleteEntityId) {
                                childList.splice(index, 1);    
                            }
                        });
                        */
                    }

                    logger.info('[알림]Entity 삭제  [id : %s] [url : %s] [이름 : %s] [entityId : %s]', userId, 'luis/deleteEntity', '[' + deleteEntityName + '] 삭제', deleteEntityId);
                    res.send({success : true, message : '삭제했습니다.'});
                    
                })()
                
            } catch(e) {
                throw new Error(e.message);
            } finally {
                sql.close();
            }
        }
        else if (tmpLuisObj.statusCode == 429) {
            logger.info('[에러]루이스 엔티티 삭제 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/deleteEntity',  'timeout!');
            res.send({success : false, message : '시간초과 입니다. 문제가 계속되면 관리자에게 문의하세요.'});

        } 
        else if (tmpLuisObj.statusCode == 400 || tmpLuisObj.statusCode == 401) {
            if (tmpLuisObj.body.error) {
                var resultCode = tmpLuisObj.body.error.code;
                var resultStr = tmpLuisObj.body.error.message;
                logger.info('[에러]루이스 엔티티 삭제 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/deleteEntity',  resultCode + ' : ' + resultStr);
                res.send({success : false, message : '엔티티 생성에 문제가 발생했습니다. 관리자에게 문의해주세요.'});
            }
        }
    } catch(e) {
        logger.info('[에러]composite child List조회  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/selectChildCompositeList', e.message);
        res.send({error : true, message : 'Composite child List조회 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
    //finally {}
});




router.get('/entityDetail', function (req, res) {
    
    //var userId = req.session.sid;
    var entityName = req.query.entityName;
    var entityId = req.query.entityId;
    var entityType = req.query.entityType;

    var entityTypeName = getEntityType(entityType);

    /*
    var selAppId = req.session.selAppId;
    var entityList = req.session.entityList;
    //var childList = req.session.entityChildList;
    var entityObj = new Object();
    for (var i=0; i<entityList.length; i++) {
        if (selAppId == entityList[i].APP_ID && entityId == entityList[i].ENTITY_ID) {
            entityObj = entityList[i];
            break;
        }
    }
    */
    res.render('luis/entityDetail', {'entityName' : entityName, 'entityId' : entityId, 'entityType' : entityType, 'entityTypeName' : entityTypeName});
    
});

router.post('/getChildEntity', function (req, res) {
    
    var userId = req.session.sid;

    var entityId = req.body.entityId;
    var entityType = req.body.entityType;

    var childList = req.session.entityChildList;

    var selChildList = [];

    try {
        switch(entityType) {
            case '1':
                //'Simple';
                break;
            case '2':
                //'Prebuilt';
                break;
            case '3':
                //'Hierarchical';
                for (var i=0; i<childList.length; i++) {
                    if (childList[i].ENTITY_ID == entityId) {
                        selChildList.push(childList[i]);
                    }
                }
                break;
            case '4':
                //'Composite';
                for (var i=0; i<childList.length; i++) {
                    if (childList[i].ENTITY_ID == entityId) {
                        selChildList.push(childList[i]);
                    }
                }
                break;
            case '5':
                //'Closed List';
                for (var i=0; i<childList.length; i++) {
                    if (childList[i].ENTITY_ID == entityId) {
                        selChildList.push(childList[i]);
                    }
                }
                break;
            default:
                break;
        }
        res.send({success : true, selChildList : selChildList});
    } catch(e) {
        logger.info('[에러]composite child List조회  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/getChildEntity', e.message);
        res.send({error : true, message : ' child List조회 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
    //finally {}
});

router.post('/saveChangedEntity', function (req, res) {

    var userId = req.session.sid;
    var entityId = req.body.entityId;
    var entityName = req.body.entityName;
    var entityType = req.body.entityType;
    var chilEntityList;
    if (entityType != "5") {
        chilEntityList = req.body.chilEntityList; //req.body['chilEntityList[]']==undefined?req.body.chilEntityList:req.body['chilEntityList[]'];
    } else {
        chilEntityList = JSON.parse(req.body.chilEntityList);
    }

    var entityList = req.session.entityList;

    var updateEntityQry = "";

    var tmpLuisObj;
    try {
        
        switch (entityType) { 
            case "1"://"readableType": "Entity Extractor",
                options.payload = { 
                    "name": entityName
                };
                tmpLuisObj = syncClient.put(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/entities/' + entityId, options);
                break;
            /*
            case "2"://"readableType": "Entity Extractor",
                break;
            */
            case "3"://"Hierarchical Entity Extractor",
                options.payload = { 
                    "name": entityName,
                    "children": chilEntityList
                };
                tmpLuisObj = syncClient.put(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/hierarchicalentities/' + entityId, options);
                break;

            case "4"://"readableType": "Composite Entity Extractor",
                options.payload = { 
                    "name": entityName,
                    "children": chilEntityList
                };
                tmpLuisObj = syncClient.put(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/compositeentities/' + entityId, options);
                break;
            case "5"://"readableType": "Closed List Entity Extractor",
                options.payload = { 
                    "name": entityName,
                    "subLists": chilEntityList
                };
                var tmpLuisObj = syncClient.put(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/closedlists/' + entityId, options);
                break;
            default :
                throw new Error("entity Type Error, input Type : " + entityType);
        }

        if (tmpLuisObj.statusCode == 200) {
            switch (entityType) { 
                case "1"://"readableType": "Entity Extractor",
                    updateEntityQry = " UPDATE TBL_LUIS_ENTITY \n";
                    updateEntityQry += "   SET ENTITY_NAME = @entityName\n ";
                    updateEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;
                /*
                case "2"://"readableType": "Entity Extractor",
                break;
                */
                case "3"://"Hierarchical Entity Extractor",
                    updateEntityQry = " UPDATE TBL_LUIS_ENTITY \n";
                    updateEntityQry += "   SET ENTITY_NAME = @entityName\n ";
                    updateEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;

                case "4"://"readableType": "Composite Entity Extractor",
                    updateEntityQry = " UPDATE TBL_LUIS_ENTITY \n";
                    updateEntityQry += "   SET ENTITY_NAME = @entityName\n ";
                    updateEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;

                case "5"://"readableType": "Closed List Entity Extractor",
                    updateEntityQry = " UPDATE TBL_LUIS_ENTITY \n";
                    updateEntityQry += "   SET ENTITY_NAME = @entityName\n ";
                    updateEntityQry += " WHERE 1=1 AND APP_ID = @appId AND ENTITY_ID = @entityId; ";
                    break;
            }

            try {
                (async () => {
                    let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
                    let updateEntityRst = await pool.request()
                                                        .input('entityName', sql.NVarChar, entityName)
                                                        .input('appId', sql.NVarChar, req.session.selAppId)
                                                        .input('entityId', sql.NVarChar, entityId)
                                                        .query(updateEntityQry);

                    //session 업데이트
                    for (var q=0; q<entityList.length; q++) {
                        if (entityList[q].APP_ID == req.session.selAppId && entityList[q].ENTITY_ID == entityId) {
                            entityList.ENTITY_NAME = entityName;
                            break;
                        }
                    } 

                    if (entityType == "3" || entityType == "4" || entityType == "5") {
                        
                        var deleteChildEntityQry = " DELETE FROM TBL_LUIS_CHILD_ENTITY \n ";
                        deleteChildEntityQry += " WHERE 1=1 AND ENTITY_ID = @entityId; ";

                        let deleteDBChildEntity = await pool.request()
                                                            .input('entityId', sql.NVarChar, entityId)
                                                            .query(deleteChildEntityQry);

                        var childObj;
                        switch (entityType) { 
                            case "3"://"Hierarchical Entity Extractor",
                                childObj = syncClient.get(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/hierarchicalentities/' + entityId, options);
                                break;
                
                            case "4"://"readableType": "Composite Entity Extractor",
                                childObj = syncClient.get(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/compositeentities/' + entityId, options);
                                break;
                            case "5"://"readableType": "Closed List Entity Extractor",
                                childObj = syncClient.get(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/closedlists/' + entityId, options);
                                break;
                        }

                        var childEntityList;
                        if (childObj.statusCode == 200) {
                            childEntityList = await luisUtil.getChildEntityList(childObj.body);
                        
                            for (var ic=0; ic<childEntityList.length; ic++) {
                                if (childEntityList[ic].typeId != 5) {//composite, hierarchy
                                    var childEntityQry = "INSERT INTO TBL_LUIS_CHILD_ENTITY (ENTITY_ID, CHILDREN_ID, CHILDREN_NAME) \n ";
                                    childEntityQry += "VALUES(@entityId, @childId, @entityName ); ";
            
                                    let insertDBChildEntity = await pool.request()
                                                                        .input('entityId', sql.NVarChar, childEntityList[ic].entityId)
                                                                        .input('childId', sql.NVarChar, childEntityList[ic].childId)
                                                                        .input('entityName', sql.NVarChar, childEntityList[ic].name)
                                                                        .query(childEntityQry);
                                }
                                else //closed list
                                {
                                    var childEntityQry = "INSERT INTO TBL_LUIS_CHILD_ENTITY (ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST) \n ";
                                    childEntityQry += "VALUES(@entityId, @childId, @entityName, @childListStr); ";
            
                                    let insertDBChildEntity = await pool.request()
                                                                        .input('entityId', sql.NVarChar, childEntityList[ic].entityId)
                                                                        .input('childId', sql.NVarChar, childEntityList[ic].childId)
                                                                        .input('entityName', sql.NVarChar, childEntityList[ic].name)
                                                                        .input('childListStr', sql.NVarChar, childEntityList[ic].childList)
                                                                        .query(childEntityQry);
                                }
                            }

                            //session 수정
                            let getDBEntityChild_result = await pool.request()
                                                    .query("SELECT ENTITY_ID, CHILDREN_ID, CHILDREN_NAME, SUB_LIST FROM TBL_LUIS_CHILD_ENTITY");              
                            req.session.entityChildList = getDBEntityChild_result.recordset;
                            
                            logger.info('[알림]Entity 수정  [id : %s] [url : %s] [이름 : %s] [entityId : %s]', userId, 'luis/saveChangedEntity', '[' + entityName + '] 수정', entityId);
                            res.send({success : true, message : '저장했습니다.'});

                        }
                        else 
                        {
                            var resultCode = childObj.body.error.code;
                            var resultStr = childObj.body.error.message;
                            logger.info('[에러]루이스 child Entity 조회  [id : %s] [url : %s] [error : %s] [내용 : %s]', userId, 'luis/saveChangedEntity',  resultCode + ' : ' + resultStr, '방금 수정한 엔티티의 child entity목록을 가져오는데 실패했습니다.');
                            res.send({success : false, message : '엔티티 조회에 실패했습니다. 앱 목록에서 다시 챗봇을 선택해 주세요.'});
                        }
                    }
                })()
            } catch(e) {
                throw new Error(e.message);
            } finally {
                sql.close();
            }
        }
    } catch(e) {
        logger.info('[에러] entity 변경 저장  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/saveChangedEntity', e.message);
        res.send({error : true, message : ' 엔티티 저장 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
});


router.post('/saveUtterance', function (req, res) {
    var userId = req.session.sid;
    var labeledUtterArr = req.body.labelArr;//req.body['labelArr[]'];
    var newUtterArr = req.body.newUtterArr;//req.body['labelArr[]'];
    var addClosedList = req.body.addClosedList==undefined? []:req.body.addClosedList;//req.body['labelArr[]'];
    var tmpLuisObj;
    var luisResult = [];
    try {
        if (labeledUtterArr.length > 0) {
            var labelArr = [];
            var tmpObj = new Object();
            
            for (var i=0; i<labeledUtterArr.length; i++) {
                options.payload = labeledUtterArr[i];
                /*
                options.payload = { 
                    "name": entityName,
                    "children" : childEntityArr
                };
                */
                console.log(options.payload);
                tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/example', options);
                console.log(tmpLuisObj.statusCode);
                if (newUtterArr != undefined) {
                    for (var j=0; j<newUtterArr.length; j++) {
                        if (newUtterArr[j].text == labeledUtterArr[i].text) {
                            newUtterArr[j].id = tmpLuisObj.body;
                        }
                    }
                }
                luisResult.push(tmpLuisObj);
            }
            for (var i=0; i<addClosedList.length; i++) {
                options.payload = { 
                    "canonicalForm": addClosedList[i].canonical,
                    "list": addClosedList[i].list
                };
                var tmpLuisListObj = syncClient.put(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/closedlists/' + addClosedList[i].entityId + '/sublists/' + addClosedList[i].childId, options);
            }
    
        }
        var rstChk = false;
        for (var tmp in luisResult) {
            console.log(luisResult[tmp]);
            if (luisResult[tmp].statusCode != 201) {
                rstChk = true;
                var resultCode = luisResult[tmp].body.error.code;
                var resultStr = luisResult[tmp].body.error.message;
                logger.info('[에러] 어터런스 변경 저장  [id : %s] [url : %s] [코드 : %s] [내용 : %s]', userId, 'luis/saveUtterance', luisResult[tmp].statusCode, resultCode + ':' + resultStr);
            } 
        }

        options = {
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': subKey
            }
        };
        if (!rstChk) {
            res.send({success : true, message : '성공'});
        } else {
            res.send({success : false, message : '실패했습니다. 관리자에게 문의해주세요.'});
        }
    } catch(e) {
        logger.info('[에러] 어터런스 변경 저장  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/saveUtterance', e.message);
        res.send({error : true, message : ' 어터런스 저장 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
    
});

router.post('/deleteUtterance', function (req, res) {
    var userId = req.session.sid;
    var utterId = req.body.utterId;//req.body['labelArr[]'];intentId
    var intentId = req.body.intentId;//req.body['labelArr[]'];
    var tmpLuisObj;
    try {
        
        tmpLuisObj = syncClient.del(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/examples/' + utterId, options);
        console.log();
        if (tmpLuisObj.statusCode == 200) { 
            var utterList = req.session.utterList;
            for (var tmpObj in utterList) {
                if (utterList[tmpObj].INTENT_ID == intentId) {
                    for (var i=0; i<utterList[tmpObj].UTTER_LIST.length; i++) {
                        if (utterList[tmpObj].UTTER_LIST[i].id == utterId) {
                            utterList[tmpObj].UTTER_LIST.splice(i, 1);
                            break;
                        }
                    }
                }
            }
            res.send({success : true, message : '성공했습니다.'});
        } else {
            res.send({success : false, message : '실패했습니다. 관리자에게 문의해주세요.'});
        }
    } catch(e) {
        logger.info('[에러] 어터런스 변경 저장  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/deleteUtterance', e.message);
        res.send({error : true, message : ' 어터런스 저장 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    } 
});

router.post('/renameIntent', function (req, res) {

    var intentId = req.body.intentId;
    var intentName = req.body.intentName;
    var tmpLuisObj;
    try {
        options.payload = { 
            "name": intentName
        };
        tmpLuisObj = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/' + '0.1' + '/intents' + intentId, options);
        
        if (tmpLuisObj.statusCode != 200) {
            var resultCode = tmpLuisObj.error.code;
            var resultStr = tmpLuisObj.error.message;
            logger.info('[에러] intent rename  저장  [id : %s] [url : %s] [코드 : %s] [내용 : %s]', userId, 'luis/renameIntent', tmp.statusCode, resultCode + ':' + resultStr);
            res.send({success : false, message : '실패했습니다. 관리자에게 문의해주세요.'});
        } else {
            res.send({success : true, message : '성공했습니다.'});
        }
    } catch(e) {
        logger.info('[에러] intent rename   [id : %s] [url : %s] [내용 : %s]', userId, 'luis/renameIntent', e.message);
        res.send({error : true, message : ' intent rename 중 이상이 생겼습니다. 관리자에게 문의 해주세요.'});
    }

});


//entity type 추출
function getEntityType(typeVal) {
    var returnVal = '';
    switch(typeVal) {
        case '1':
            returnVal = 'Simple';
            break;
        case '2':
            returnVal = 'Prebuilt';
            break;
        case '3':
            returnVal = 'Hierarchical';
            break;
        case '4':
            returnVal = 'Composite';
            break;
        case '5':
            returnVal = 'Closed List';
            break;
        default:
            returnVal = 'None';
            break;
    }
    return returnVal;
}








//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
/* GET users listing. */
router.get('/publish', function (req, res) {

    var selAppId = req.session.selAppId;
    var userId = req.session.sid;
    
    var publishSettings = req.session.publishsettings;
    var endpoint = req.session.endpoint;
    var subscriptions = req.session.subscriptions;

    var selectIntentQry = "";
    var selectedAppList = [];
    var selectedIntentList = [];
    
    var leftList = req.session.leftList;
    var chatNum = -1;

    var selAppList = req.session.selChatInfo.chatbot.appList;
    if (typeof req.query.appIndex != 'undefined') {
        var appNumber = req.query.appIndex;
        var selApp = selAppList[appNumber];
        req.session.selAppId = selApp.APP_ID;
        selAppId = req.session.selAppId;
    }

    if (typeof req.session.publishsettings == 'undefined') {
        
        var tmpLuisObj = syncClient.get(HOST + '/luis/api/v2.0/apps/' + selAppId + '/publishsettings', options);

        var sentimentAnalysis = tmpLuisObj.body.sentimentAnalysis;
        var speech = tmpLuisObj.body.speech;
        var spellChecker = tmpLuisObj.body.spellChecker;

        
    } else {
        
    }

    // if (typeof req.session.endpoint == 'undefined') {
    //     var tmpLuisObj2 = syncClient.get(HOST + '/luis/api/v2.0/apps/' + selAppId + '/endpoints', options);
    // }

    // if (typeof req.session.subscriptions == 'undefined') {
    //     var tmpLuisObj3 = syncClient.get(HOST + '/luis/webapi/v2.0/apps/' + selAppId + '/subscriptions', options);
    // }
 
    res.render('luis/publish',{
        'HOST' : HOST,
        'subscriptionkey' : options.headers["Ocp-Apim-Subscription-Key"],
        'appid' : selAppId,
        'spellChecker' : spellChecker
         });
 
});

router.post('/publishExecution', function (req, res){
    var appName = req.session.appName;
    var subsKey = req.session.subsKey;

    var options = {
        headers: {
            'Ocp-Apim-Subscription-Key': subsKey
        }
    };

    var selectAppIdQuery = "SELECT CHATBOT_ID, APP_ID, VERSION, APP_NAME,CULTURE, SUBSC_KEY \n";
    selectAppIdQuery += "FROM TBL_LUIS_APP \n";
    selectAppIdQuery += "WHERE CHATBOT_ID = (SELECT CHATBOT_NUM FROM TBL_CHATBOT_APP WHERE CHATBOT_NAME=@chatName)\n";

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let selectAppId = await pool.request()
                .input('chatName', sql.NVarChar, appName)
                .query(selectAppIdQuery);

                var repeat = setInterval(function(){
                    var trainCount = 0;
                    var count = 0;
    
                    var pubOption = {
                        headers: {
                            'Ocp-Apim-Subscription-Key': subsKey,
                            'Content-Type':'application/json'
                        },
                        payload:{
                            'versionId': '0.1',
                            'isStaging': false,
                            'region': 'westus'
                        }
                    }
    
                    for(var i = 0; i < selectAppId.recordset.length; i++) {
                        var luisAppId = selectAppId.recordset[i].APP_ID;
                        var publishResult = syncClient.post(HOST + '/luis/api/v2.0/apps/' + luisAppId + '/publish' , pubOption);
                        console.log("publishResult : " + publishResult);
                    }

                    clearInterval(repeat);
                    console.log("Test")
                    res.send({result:200});

                },1000);

        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()
});

router.post('/trainApp', function (req, res){

    var userId = req.session.sid;
    var publishCount = 0;
    
    var selAppList = req.session.selChatInfo.chatbot.appList;
    if (typeof req.body.appIndex != 'undefined') {
        var appNumber = req.body.appIndex;
        var selApp = selAppList[appNumber];
        req.session.selAppId = selApp.APP_ID;
    }

    (async () => {
        try {
            var repeat = setInterval(function(){
                var trainCount = 0;
                var count = 0;

                var pubOption = {
                    headers: {
                        'Ocp-Apim-Subscription-Key': luisConfig.subKey,
                        'Content-Type':'application/json'
                    },
                    payload:{
                        'versionId': '0.1',
                        'isStaging': false,
                        'region': 'westus'
                    }
                }


                var traninResultGet = syncClient.get(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/versions/0.1/train' , options);
                for(var trNum = 0; trNum < traninResultGet.body.length; trNum++) {
                    if(traninResultGet.body[trNum].details.status == "Fail") {
                        var failureReason = traninResultGet.body[trNum].details.failureReason;
                        logger.info('[에러] train app   [id : %s] [url : %s] [내용 : %s]', userId, 'luis/renameIntent', failureReason);
                        res.send({result:400, message:failureReason});
                    } else if(traninResultGet.body[trNum].details.status == "InProgress") {
                        break;
                    } else {
                        count++;
                    }
                    //if(traninResultGet.body[trNum].details.status == "Success") {
                    //    count++;
                    //}
                }

                trainCount = traninResultGet.body.length;

                if(count != 0 && trainCount == count) {
                    var publishResult = syncClient.post(HOST + '/luis/api/v2.0/apps/' + req.session.selAppId + '/publish' , pubOption);
                    publishCount++;
                    if (publishResult.statusCode == 201) {
                        clearInterval(repeat);
                        res.send({result:200});
                    }
                    if (publishCount >= 3) {
                        logger.info('[에러] publish app  3회 실패  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/renameIntent', '실패');
                        res.send({result:publishResult.statusCode, message:'publish 실패했습니다. 관리자에게 문의해주세요.'});
                    }
                }
            },1000);


        } catch (err) {
            logger.info('[에러] publish & train err  [id : %s] [url : %s] [내용 : %s]', userId, 'luis/renameIntent', err.message);
            res.send({result:400, message:'publish 실패했습니다. 관리자에게 문의해주세요.'});
        } finally {
            sql.close();
        }
    })()

});

//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------



/* 
//파일 입출력 test

var multer = require('multer'); // express에 multer모듈 적용 (for 파일업로드)
var upload = multer({ dest: 'uploads/' })
var multiparty = require('multiparty');
var fs = require('fs');
var parser = require('json-parser');

var filePath = "./tmp/"


router.post('/upload', function (req, res) {

    //var data = fs.readFileSync(filePath + 'admin_dsfdsf.json', 'utf8');

    var userId = req.session.sid;
    var filename;
    var size;

    var form = new multiparty.Form();



    // get field name & value

    form.on('field', function (name, value) {
        console.log('normal field / name = ' + name + ' , value = ' + value);
    });

    form.on('error', function (err) {
        console.log('err = ' + err.stack  );
    });

    // file upload handling
    form.on('part',function(part){


        if (part.filename) {
            filename = userId + "_" + part.filename;
            size = part.byteCount;

        }else{
            part.resume();
        }    


        console.log("Write Streaming file :"+filename);
        var writeStream = fs.createWriteStream(filePath + filename);
        writeStream.filename = filename;
        part.pipe(writeStream);

 
        part.on('data',function(chunk){
            console.log(filename+' read '+chunk.length + 'bytes');
        });

        part.on('error', function (err) {
            res.status(200).send({ result: false });
        });
          
        part.on('end',function(){
            console.log(filename+' Part read complete');
            writeStream.end();
        });

    });

    // all uploads are completed
    form.on('close', function () {



        fs.readFile(filePath + filename, "utf8", function (err, data) {
            if (err) {
                //throw err;
                res.status(200).send({ result: false });
            }
            try {
                var object = parser.parse(data.toString());
                //var jsonData = JSON.parse(data.toString());

                res.status(200).send({ result: true });

            } catch (e) {

                res.status(200).send({ result: false });
            }

        });

        //var data = fs.readFileSync(filePath + filename);
        //var jsonData = JSON.parse(data);

    });

    form.parse(req);

});
*/
module.exports = router;
