'use strict';

var express = require('express');

var sql = require('mssql');
var dbConfig = require('../../config/dbConfig');
var dbConnect = require('../../config/dbConnect');

const appDbConnect = require('../../config/appDbConnect');

var router = express.Router();

//log start
var Logger = require("../../config/logConfig");
var logger = Logger.CreateLogger();
//log end


router.get('/getChatSentence', function (req, res) {

    if (req.query.chat_res_code == '976431') {
        (async () => {
            try {
                let pool = await dbConnect.getConnection(sql);
                
                
                var selectQry = "SELECT USER_ID \n"
                selectQry += "          ,EMP_NM \n";
                selectQry += "     FROM TB_USER_M; \n";


                let getSentence = await pool.request().query(selectQry);
                let similarSentence = getSentence.recordset;

                var content = new Object();
                var contentList = [];
                for (var i=0; i<similarSentence.length; i++) {
                    contentList.push(similarSentence[i].USER_ID);
                }
                
                content['statusCode'] = 200;
                content['content'] = contentList;
                return res.json(content);
            }
            catch(e) {
                
                logger.info('[에러]자동완성 api 응답 에러  [url : %s] [내용 : %s]', 'apiServer/getChatSentence',  e.message);
                var apiFail = [
                    {
                        statusCode : 500
                    }
                ]
                return res.json(apiFail);
            }
        })();
    } else {
        var apiFail = [
            {
                statusCode : 401
            }
        ]
        return res.json(apiFail);
    }

});


module.exports = router;
