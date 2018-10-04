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

//공통코드 Master
router.get('/codeMasterMng', function (req, res) {  
    res.render('codeMng/codeMasterMng');
});

//공통코드 Detail
router.get('/codeDetailMng', function (req, res) { 
    var CDM_ID = req.query.CDM_ID;
    //res.render('codeMng/codeDetailMng');
    res.render('codeMng/codeDetailMng', {
        selMenus: req.session.selMenus,
        CDM_ID: CDM_ID
    });
});


/*
* 공통코드 master 저장,수정,삭제
*/
router.post('/procCodeMaster', function (req, res) {  
    var codeMasterArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";

    

    for (var i=0; i<codeMasterArr.length; i++) {
        if (codeMasterArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TB_CODE_M (CDM_ID, CDM_NM, CDM_EXPL, USE_YN, REG_DT) " + 
                       "VALUES ( ";
            saveStr += " '" + codeMasterArr[i].CODE_ID  + "', '" + codeMasterArr[i].CODE_NM  + "', '" + codeMasterArr[i].CODE_DESC  + "', 'Y',  GETDATE()); ";
        } else if (codeMasterArr[i].statusFlag === 'UPDATE') {
            updateStr += "UPDATE TB_CODE_M SET CDM_NM = '" + codeMasterArr[i].CODE_NM  + "', CDM_EXPL = '" + codeMasterArr[i].CODE_DESC  + "' WHERE CDM_ID = '" + codeMasterArr[i].CODE_ID + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TB_CODE_M WHERE CDM_ID = '" + codeMasterArr[i].CODE_ID + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                let insertCodeMaster = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateCodeMaster = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteCodeMaster = await pool.request().query(deleteStr);
            }

            res.send({status:200 , message:'Save Success'});
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'Save Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

/*
* 공통코드 detail 저장,수정,삭제
*/
router.post('/procCodeDetail', function (req, res) {  
    var codeDetailArr = JSON.parse(req.body.saveArr);
    var saveStr = "";
    var updateStr = "";
    var deleteStr = "";

    

    for (var i=0; i<codeDetailArr.length; i++) {
        if (codeDetailArr[i].statusFlag === 'NEW') {
            saveStr += "INSERT INTO TB_CODE_D (CDM_ID, CD, LANG, CD_NM, CD_EXPL, CD_SEQ, USE_YN, STR_1, STR_2, STR_3, REG_DT) " + 
                       "VALUES ( ";
            saveStr += " '" + codeDetailArr[i].CDM_ID  + "', '" + codeDetailArr[i].CD  + "', '" + codeDetailArr[i].LANG  + "', ";
            saveStr += " '" + codeDetailArr[i].CD_NM  + "', '" + codeDetailArr[i].CD_EXPL  + "', '" + codeDetailArr[i].CD_SEQ  + "', ";
            saveStr += " 'Y', '" + codeDetailArr[i].STR_1  + "', '" + codeDetailArr[i].STR_2  + "', ";
            saveStr += " '" + codeDetailArr[i].STR_3  + "', GETDATE()); ";
        } else if (codeDetailArr[i].statusFlag === 'UPDATE') {
            updateStr += "UPDATE TB_CODE_D SET ";
            updateStr += "CD = '" + codeDetailArr[i].CD  + "', CD_NM = '" + codeDetailArr[i].CD_NM + "', ";
            updateStr += "CD_EXPL = '" + codeDetailArr[i].CD_EXPL  + "', CD_SEQ = '" + codeDetailArr[i].CD_SEQ + "', ";
            updateStr += "STR_1 = '" + codeDetailArr[i].STR_1  + "', STR_2 = '" + codeDetailArr[i].STR_2 + "', ";
            updateStr += "STR_3 = '" + codeDetailArr[i].STR_3  + "', MOD_DT = GETDATE() ";
            updateStr += "WHERE CDM_ID = '" + codeDetailArr[i].CDM_ID + "'; ";
        } else { //DEL
            deleteStr += "DELETE FROM TB_CODE_D WHERE CDM_ID = '" + codeDetailArr[i].CDM_ID + "' AND CD ='" + codeDetailArr[i].CD + "'; ";
        }
    }

    (async () => {
        try {
            let pool = await dbConnect.getConnection(sql);
            if (saveStr !== "") {
                let insertCodeDetail = await pool.request().query(saveStr);
            }
            if (updateStr !== "") {
                let updateCodeDetail = await pool.request().query(updateStr);
            }
            if (deleteStr !== "") {
                let deleteCodeDetail = await pool.request().query(deleteStr);
            }

            res.send({status:200 , message:'Save Success'});
            
        } catch (err) {
            console.log(err);
            res.send({status:500 , message:'Save Error'});
        } finally {
            sql.close();
        }
    })()

    sql.on('error', err => {
        // ... error handler
    })
});

router.post('/selectCodeMasterList', function (req, res) {

    let searchType = checkNull(req.body.searchType, null);
    let searchWord = checkNull(req.body.searchWord, null);

    (async () => {
        try {
         
            var QueryStr =  "SELECT  A.CDM_ID , A.CDM_NM, A.CDM_EXPL, A.CDM_SEQ, A.USE_YN, A.REG_ID, A.REG_DT, A.MOD_ID, A.MOD_DT";
                QueryStr += " FROM TB_CODE_M A WHERE 1 = 1";

            if(searchWord==""||searchWord==null){
                
            }else{
                if (searchType=="cdId") {
                    QueryStr += "AND A.CDM_ID LIKE '%" + searchWord + "%' \n";
                }

                if (searchType=="cdNm") {
                    QueryStr += "AND A.CDM_NM LIKE '%" + searchWord + "%' \n";
                }
            }

            QueryStr += " ORDER BY A.CDM_SEQ, A.CDM_ID";
            
            
            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                

                recordList.push(item);
            }

            if(rows.length > 0){
                res.send({
                    records : recordList.length,
                    rows : recordList
                });

            }else{
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

router.post('/selectCodeDetailList', function (req, res) {

    let CDM_ID = checkNull(req.body.CDM_ID, null);
    (async () => {
        try {
         
            var QueryStr =  "SELECT  A.CDM_ID, A.CD, A.LANG, A.CD_NM, A.CD_EXPL, A.CD_SEQ, A.USE_YN, A.STR_1, A.STR_2, A.STR_3, A.REG_ID, A.REG_DT, A.MOD_ID, A.MOD_DT";
                QueryStr += " FROM TB_CODE_D A WHERE 1 = 1";
                QueryStr += " AND A.CDM_ID = '"+CDM_ID +"'";

            QueryStr += " ORDER BY A.CD_SEQ";
            
            let pool = await dbConnect.getConnection(sql);
            let result1 = await pool.request().query(QueryStr);

            let rows = result1.recordset;

            var recordList = [];
            for(var i = 0; i < rows.length; i++){
                var item = {};
                item = rows[i];
                

                recordList.push(item);
            }

            if(rows.length > 0){
                res.send({
                    records : recordList.length,
                    rows : recordList
                });

            }else{
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

module.exports = router;