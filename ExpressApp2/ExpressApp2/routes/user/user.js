'use strict';
var express = require('express');
var Client = require('node-rest-client').Client;
var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');
var paging = require('../../config/paging');
var util = require('../../config/util');
var Client = require('node-rest-client').Client;

const syncClient = require('sync-rest-client');
const appDbConnect = require('../../config/appDbConnect');
const appSql = require('mssql');

var router = express.Router();


//사용자 앱매핑 관리
router.get('/userAppMappingMng', function (req, res) {
    res.render('userMng/userAppMappingMng');
});

//사용자 권한 관리
router.get('/userAuthMng', function (req, res) {
    res.render('userMng/userAuthMng');
});

router.post('/selectUserList', function (req, res) {

    let sortIdx = checkNull(req.body.sort, "USER_ID") + " " + checkNull(req.body.order, "ASC");
    let pageSize = checkNull(req.body.rows, 10);
    let currentPageNo = checkNull(req.body.page, 1);

    let searchName = checkNull(req.body.searchName, null);
    let searchId = checkNull(req.body.searchId, null);

    (async () => {
        try {

            var QueryStr = "SELECT TBZ.* ,(TOT_CNT - SEQ + 1) AS NO \n" +
                "  FROM (SELECT TBY.* \n" +
                "          FROM (SELECT ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") AS SEQ, \n" +
                "                       COUNT('1') OVER(PARTITION BY '1') AS TOT_CNT, \n" +
                "                       CEILING(ROW_NUMBER() OVER(ORDER BY TBX." + sortIdx + ") / CONVERT( NUMERIC, " + pageSize + " ) ) PAGEIDX, \n" +
                "                       TBX.* \n" +
                "                  FROM ( \n" +
                "                         SELECT \n" +
                "                              A.EMP_NUM      AS EMP_NUM \n" +
                "                            , ISNULL(A.USER_ID, ' ')      AS USER_ID \n" +
                //"                            , ISNULL(A.SCRT_NUM, ' ')     AS SCRT_NUM " +
                "                            , ISNULL(A.EMP_NM, ' ')       AS EMP_NM \n" +
                "                            , ISNULL(A.EMP_ENGNM, ' ')    AS EMP_ENGNM \n" +
                "                            , ISNULL(A.EMAIL, ' ')        AS EMAIL \n" +
                "                            , ISNULL(A.M_P_NUM_1, ' ')    AS M_P_NUM_1 \n" +
                "                            , ISNULL(A.M_P_NUM_2, ' ')    AS M_P_NUM_2 \n" +
                "                            , ISNULL(A.M_P_NUM_3, ' ')    AS M_P_NUM_3 \n" +
                "                            , ISNULL(A.USE_YN, ' ')       AS USE_YN \n" +
                "                            , ISNULL(CONVERT(NVARCHAR(10), A.REG_DT, 120), ' ') AS REG_DT \n" +
                "                            , ISNULL(A.REG_ID, ' ')       AS REG_ID " +
                "                            , ISNULL(CONVERT(NVARCHAR(10), A.MOD_DT, 120), ' ') AS MOD_DT \n" +
                "                            , ISNULL(A.MOD_ID, ' ')       AS MOD_ID \n" +
                "                            , ISNULL(A.LOGIN_FAIL_CNT, 0)      AS LOGIN_FAIL_CNT \n" +
                "                            , ISNULL(CONVERT(NVARCHAR, A.LAST_LOGIN_DT, 120), ' ')  AS LAST_LOGIN_DT \n" +
                "                            , ISNULL(CONVERT(NVARCHAR, A.LOGIN_FAIL_DT, 120), ' ')  AS LOGIN_FAIL_DT \n" +
                "                            , USER_AUTH  AS USER_AUTH \n" +
                "                            , (SELECT AUTHGRP_M_NM FROM TB_AUTHGRP_M WHERE AUTH_LEVEL = A.USER_AUTH) AS AUTH_NM \n" +
                "                         FROM TB_USER_M A \n" +
                "                         WHERE 1 = 1 \n" +
                "					      AND A.USE_YN = 'Y' \n";

            if (searchName) {
                QueryStr += "					      AND A.EMP_NM like '%" + searchName + "%' \n";
            }
            if (searchId) {
                QueryStr += "					      AND A.USER_ID like '%" + searchId + "%' \n";
            }
            QueryStr += "                       ) TBX \n" +
                "               ) TBY \n" +
                "       ) TBZ \n" +
                " WHERE PAGEIDX = " + currentPageNo + " \n" +
                "ORDER BY " + sortIdx + " \n";

            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                item = rows[i];


                recordList.push(item);
            }


            if (rows.length > 0) {

                var totCnt = 0;
                if (recordList.length > 0)
                    totCnt = checkNull(recordList[0].TOT_CNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOT_CNT, 10) + 1);


                res.send({
                    records: recordList.length,
                    total: getTotalPageCount,
                    pageList: paging.pagination(currentPageNo, rows[0].TOT_CNT), //page : checkNull(currentPageNo, 1),
                    rows: recordList
                });

            } else {
                res.send({ list: result });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })


});

function checkNull(val, newVal) {
    if (val === "" || typeof val === "undefined" || val === "0") {
        return newVal;
    } else {
        return val;
    }
}

router.post('/getAuthList', function (req, res) {

    (async () => {
        try {
            var QueryStr = "SELECT AUTHGRP_M_NM, AUTH_LEVEL FROM TB_AUTHGRP_M ORDER BY AUTH_LEVEL ";

            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for (var i = 0; i < rows.length; i++) {
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            if (rows.length > 0) {
                res.send({
                    records: recordList.length,
                    rows: recordList
                });

            } else {
                res.send({
                    records: 0,
                    rows: null
                });
            }
        } catch (err) {
            console.log(err)
            // ... error checks
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/updateUserAuth', function (req, res) {
    var userAuthArr = JSON.parse(req.body.saveArr);
    var updateStr = "";
    var userId = req.session.sid;

    for (var i = 0; i < userAuthArr.length; i++) {
        updateStr += "UPDATE TB_USER_M SET ";
        updateStr += "USER_AUTH = '" + userAuthArr[i].AUTH_LEVEL + "', ";
        updateStr += "MOD_ID = '" + userId + "', MOD_DT = GETDATE() ";
        updateStr += "WHERE USER_ID = '" + userAuthArr[i].USER_ID + "'; ";
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);

            if (updateStr !== "") {
                let updateCodeDetail = await pool.request().query(updateStr);
            }

            res.send({ status: 200, message: 'Save Success' });

        } catch (err) {
            console.log(err);
            res.send({ status: 500, message: 'Save Error' });
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/selectUserAppList', function (req, res) {
    
    let userId = checkNull(req.body.userId, '');
    var currentPage = checkNull(req.body.currentPage, 1);
    var currentPageUser = checkNull(req.body.currentPageUser, 1);
    var selectAppListStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY CHATBOT_NAME DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY CHATBOT_NAME DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         CHATBOT_NUM, CHATBOT_NAME, CULTURE, DESCRIPTION, APP_COLOR \n" +
                           "          FROM TBL_CHATBOT_APP ) tbp \n" +
                           " WHERE 1=1 \n" +
                           "   AND PAGEIDX = " + currentPage + "; \n";

    var UserAppListStr = "SELECT tbp.* from \n" +
                         "   (SELECT ROW_NUMBER() OVER(ORDER BY USER_ID DESC) AS NUM, \n" +
                         "           COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                         "           CEILING((ROW_NUMBER() OVER(ORDER BY USER_ID DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                        "            APP_ID \n" +
                        "       FROM TBL_USER_RELATION_APP \n" +
                        "      WHERE 1=1 \n" +
                        "        AND USER_ID = '" + userId + "') tbp  \n" + 
                        " WHERE 1=1;  \n";
                        //"   AND PAGEIDX = " + currentPage + "; \n";                  
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            let appList = await pool.request().query(selectAppListStr);
            let rows = appList.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                recordList.push(item);
            }

            let userAppList = await pool.request().query(UserAppListStr);
            let rows2 = userAppList.recordset;

            var checkedApp = [];
            for(var i = 0; i < rows2.length; i++){
                for (var j=0; j < recordList.length; j++) {
                    if (Number(rows2[i].APP_ID) === recordList[j].CHATBOT_NUM) {
                        var item = {};
                        item = rows2[i];
                        checkedApp.push(item);
                        break;
                    }
                }
                
            }

            res.send({
                records : recordList.length,
                rows : recordList,
                checkedApp : checkedApp,
                pageList : paging.pagination(currentPage,rows[0].TOTCNT)
            });
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'app Load Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
})

router.post('/updateUserAppList', function (req, res) {
    let userId = req.body.userId;
    let saveData = JSON.parse(checkNull(req.body.saveData, ''));
    let removeData = JSON.parse(checkNull(req.body.removeData, ''));
    var saveDataStr = "";
    var removeDataStr = "";

    for (var i=0; i<saveData.length; i++) {
        saveDataStr += "INSERT INTO TBL_USER_RELATION_APP(USER_ID, APP_ID, CHAT_ID) " +
                    "     VALUES ('" + userId + "', " + saveData[i] + ", " + saveData[i] + "); \n";    
    }
    
    for (var i=0; i<removeData.length; i++) {
        removeDataStr += "DELETE FROM TBL_USER_RELATION_APP \n" +
                    "      WHERE 1=1 \n" +
                    "        AND CHAT_ID = " + removeData[i].APP_ID + " \n" +
                    "        AND USER_ID = '" + userId + "'; \n";     
    }
                        
                   
    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveData.length > 0) {
                let appList = await pool.request().query(saveDataStr);
            }
            
            if (removeData.length > 0) {
                let userAppList = await pool.request().query(removeDataStr);
            }

            res.send({status:200 , message:'Update Success'});
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'Update Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
    
})

module.exports = router;