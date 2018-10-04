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

//자동완성 관리
router.get('/autoCompleteMng', function (req, res) {
    res.render('chatbotMng/autoCompleteMng');
});

router.post('/selectAutoCompleteList', function (req, res) {
    var pageSize = checkNull(req.body.rows, 10);
    var currentPage = checkNull(req.body.currentPage, 1);

    (async () => {
        try {

            var QueryStr = "SELECT tbp.* from \n" +
                            " (SELECT ROW_NUMBER() OVER(ORDER BY SEQ DESC) AS NUM, \n" +
                            "         COUNT('1') OVER(PARTITION BY '1') AS TOTCNT, \n"  +
                            "         CEILING((ROW_NUMBER() OVER(ORDER BY SEQ DESC))/ convert(numeric ,10)) PAGEIDX, \n" +
                            "         SEQ, CONTENT, REG_DT, USE_YN \n" +
                           "          FROM TBL_AUTOCOMPLETE ) tbp \n" +
                           " WHERE 1=1 \n" +
                           "   AND PAGEIDX = " + currentPage + "; \n";

            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
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
                    totCnt = checkNull(recordList[0].TOTCNT, 0);
                var getTotalPageCount = Math.floor((totCnt - 1) / checkNull(rows[0].TOTCNT, 10) + 1);


                res.send({
                    records: recordList.length,
                    total: getTotalPageCount,
                    pageList: paging.pagination(currentPage, rows[0].TOTCNT), //page : checkNull(currentPageNo, 1),
                    rows: recordList
                });

            } else {
                res.send({
                    records : 0,
                    rows : null
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


function checkNull(val, newVal) {
    if (val === "" || typeof val === "undefined" || val === "0") {
        return newVal;
    } else {
        return val;
    }
}

router.post('/procAutoComplete', function (req, res) {
    var menuArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";
    var userId = req.session.sid;

    for (var i = 0; i < menuArr.length; i++) {
        if (menuArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TBL_AUTOCOMPLETE (CONTENT, REG_DT, USE_YN) " +
                "VALUES (";
            saveStr += " '" + menuArr[i].CONTENT + "', GETDATE(), 'Y');";
        }else  if (menuArr[i].statusFlag === 'UPDATE') {
            updateStr += "UPDATE TBL_AUTOCOMPLETE SET ";
            updateStr += "CONTENT = '" + menuArr[i].CONTENT  + "', USE_YN = '" + menuArr[i].USE_YN + "' ";
            updateStr += "WHERE SEQ = '" + menuArr[i].UPDATE_SEQ + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TBL_AUTOCOMPLETE WHERE SEQ = '" + menuArr[i].DEL_SEQ + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getAppConnection(sql, req.session.appName, req.session.dbValue);
            if (saveStr !== "") {
                let insertAutoComplete = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateAutoComplete = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteAutoComplete = await pool.request().query(deleteStr);
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

module.exports = router;