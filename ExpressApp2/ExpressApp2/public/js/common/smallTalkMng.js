//가장 먼저 실행.
var language;
;(function($) {
    $.ajax({
        url: '/jsLang',
        dataType: 'json',
        type: 'POST',
        success: function(data) {
            language= data.lang;
        }
    });
})(jQuery);

$(document).ready(function() {
    makeSmallTalkTable();    
});

$(document).ready(function() {
    //삭제 버튼 confirm
    $('#cancelSmallTalkBtnModal').click(function() {
        var del_count = $("#CANCEL_ST_SEQ:checked").length;
         
        if(del_count > 0){
            $('#cancel_content').html(' 정말로 취소하시겠습니까? 복구할 수 없습니다.');
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button><button type="button" class="btn btn-primary" id="cancelSmallTalkBtn"><i class="fa fa-edit"></i> SmallTalk Cancel</button>');
        }else{
            $('#cancel_content').html('취소할 대상은 한 개 이상이어야 합니다.');
            $('#footer_button').html('<button type="button" class="btn btn-default" data-dismiss="modal"><i class="fa fa-times"></i> Close</button>');
        }
        $('#cancelSmallTalkModal').modal('show');
    });

    //삭제 버튼
    $(document).on("click", "#cancelSmallTalkBtn", function () {
        cancelSmallTalkProc('DEL');
    });

    $('#searchDlgBtn').click(function (e) {
        makeSmallTalkTable(1);
    });

    //다이얼로그생성모달 버튼Add From
    $('#addDialogBtn').click(function (e) {
        //$(".insertForm:eq(0)").clone(true).appendTo(".copyForm");
        //$(".copyForm textarea[name=dialogText]:last").val('');

        var insertForm = '';
        insertForm += '<hr>';
        insertForm += '<div class="insertForm">';
        insertForm += '<div class="form-group" >';
        insertForm += '<form name="dialogLayout" id="dialogLayout">';

        insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span></label>';
        insertForm += '<select class="form-control" name="dlgType">';
        insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
        insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
        insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
        insertForm += '</select>';
        insertForm += '<div class="clear-both"></div>';

        insertForm += '<div class="textLayout" style="display: block;">';
        insertForm += '<div class="btn_wrap" style="clear:both">';
        insertForm += '</div>'
        insertForm += '<div class="form-group">';
        insertForm += '<label>' + language.DIALOG_BOX_TITLE + '</label>';
        insertForm += '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder=" ' + language.Please_enter + '">';
        insertForm += '</div>';
        insertForm += '<div class="form-group">';
        insertForm += '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>';
        insertForm += '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder=" ' + language.Please_enter + ' ">';
        insertForm += '</div>';
        insertForm += '</div>';
        insertForm += '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >';
        insertForm += '<button type="button" class="btn btn-default deleteInsertForm">' + language.DELETE_DIALOG + '</button>';
        insertForm += '</div>';
        insertForm += '</form>';
        insertForm += '</div>';
        insertForm += '</div>';

        $(".insertForm:last").after(insertForm);
        //$(".insertFormWrap").append(insertForm);
        var dialogView = '';
        dialogView += '<div class="dialogView" >';
        dialogView += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
        dialogView += '<div class="wc-message-content">';
        dialogView += '<svg class="wc-message-callout"></svg>';
        dialogView += '<div>';
        dialogView += '<div class="format-markdown">';
        dialogView += '<div class="textMent">';
        dialogView += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
        dialogView += '<p>' + language.Please_enter_your_content + '</p>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';

        $('#dialogViewWrap').append(dialogView);
        e.stopPropagation();
        e.preventDefault();

    });


    //다이얼로그생성모달 - 미디어버튼추가
    $(document).on('click', '.addMediaBtn', function (e) {

        var inputHtml = '<label>' + language.BUTTON + '</label></div>' +
            '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
            '<table class="mediaCopyTbl" style="width:100%"><col width="21%">' +
            '<col width="1%"><col width="35%"><col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
            '<thead><tr><th>' + language.Type + '</th><th></th>' +
            '<th>' + language.NAME + '</th><th></th><th>' + language.CONTENTS + '</th>' +
            '<th></th><th></th></tr></thead><tbody>' +
            '<tr><td>' +
            '<select class="form-control" name="btnType">' +
            '<option value="imBack" selected>imBack</option>' +
            '<option value="openURL">openURL</option>' +
            '</select>' +
            '</td><td></td>' +
            '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</td><td></td><td>' +
            '<input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</td><td></td><td>' +
            '<a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a>' +
            '</td></tr></tbody></table></div></div></div>';

        $btnInsertDiv = $(this).parent().prev();
        if ($btnInsertDiv.children().length == 0) {
            $btnInsertDiv.html(inputHtml);
            return;
        }
        var trLength = $btnInsertDiv.find('tbody tr').length;
        if (trLength >= 1 && trLength < 4) {

            var inputTrHtml = '<tr>' +
                '<td>' +
                '<select class="form-control" name="btnType">' +
                '<option value="imBack" selected>imBack</option>' +
                '<option value="openURL">openURL</option>' +
                '</select>' +
                '</td><td></td>' +
                '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
                '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
                '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
                '</tr>'
            $(this).parent().prev().find('tbody').append(inputTrHtml);
        } else {
            alert(language.Up_to_4_buttons_can_be_added);
        }

    });

    // 다이얼로그 생성 모달 (다이얼로그 타입변경)
    $(document).on('change', 'select[name=dlgType]', function (e) {

        addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
            '<button type="button" class="btn btn-default addCarouselBtn">' + language.INSERT_MORE_CARDS + '</button>' +
            '</div>';

        carouselForm = '<div class="carouselLayout">' +
            '<div class="form-group">' +
            '<label>' + language.IMAGE_URL + '</label>' +
            '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
            '</div>' +
            '<div class="modal_con btnInsertDiv">' +
            '</div>' +
            '<div class="clear-both"></div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
            '</div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
            '</div>' +
            '<div class="clear-both"></div>' +
            '</div>';

        mediaForm = '<label>' + language.IMAGE_URL + '<span class="nec_ico">*</span></label>' +
            '<input type="text" name="mediaImgUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
            '<div class="form-group">' +
            '<label>' + language.MEDIA_URL + '</label>' +
            '<input type="text" name="mediaUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
            '</div>' +
            '<div class="modal_con btnInsertDiv">' +
            '</div>' +
            '<div class="btn_wrap" style="clear:both" >' +
            '<button type="button" class="btn btn-default addMediaBtn" >' + language.INSERT_MORE_BUTTON + '</button>' +
            '<div class="clear-both"></div>';

        var idx = $("select[name=dlgType]").index(this);
        var insertHtml = "";

        $('.insertForm:eq(' + idx + ') .carouselLayout').remove();
        $('.insertForm:eq(' + idx + ') .carouselLayout').after().remove();
        $('.insertForm:eq(' + idx + ') .mediaLayout').remove();
        $('.insertForm:eq(' + idx + ') .mediaLayout').after().remove();
        $('.insertForm:eq(' + idx + ')').find('.clear-both').each(function (index) {
            $('.insertForm:eq(' + idx + ') form').find('.addCarouselBtnDiv').remove();
            if (index != 0) {
                $(this).next().remove();
                $(this).remove();
            }
        });

        if ($(e.target).val() == "2") {

        } else if ($(e.target).val() == "3") {
            //var $clone = $('.carouselLayout').clone();  <div id="carouselLayout" style="display: block;">[object Object]</div>
            //var caraousHtml = '<div class="carouselLayout" style="display: block;">' +  + '</div>'
            $('.insertForm:eq(' + idx + ') form .deleteInsertFormDiv').before(addCarouselForm);
            $('.insertForm:eq(' + idx + ') form').find('.addCarouselBtnDiv').before(carouselForm);
            $('.insertForm:eq(' + idx + ') .carouselLayout').css('display', 'block');
            $('.insertForm:eq(' + idx + ') .carouselLayout').find('.addCarouselBtn:last').closest('div').css('display', 'inline-block');
        } else if ($(e.target).val() == "4") {
            //var mediaForm = '<div id="mediaLayout" style="display: block;">' + $mediaForm.html() + '</div>'
            $('.insertForm:eq(' + idx + ') form .deleteInsertFormDiv').before('<div class="mediaLayout" style="display:none;">' + mediaForm + '</div>');
            //$('.insertForm:eq(' + idx + ') form').append('<div class="mediaLayout" style="display:none;">' + mediaForm + '</div>') ;
            $('.insertForm:eq(' + idx + ') .mediaLayout').css('display', 'block');
            $('.insertForm:eq(' + idx + ') .mediaLayout').find('.addMediaBtn:last').closest('div').css('display', 'inline-block');
        }

        if ($(e.target).val() == "2") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
            insertHtml += '<div class="wc-message-content">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div><div class="format-markdown"><div class="textMent">';
            insertHtml += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
            insertHtml += '<p>';
            insertHtml += language.Please_enter;
            insertHtml += '</p>';
            insertHtml += '</div></div></div></div></div>';

            $(".dialogView").eq(idx).html(insertHtml);
        } else if ($(e.target).val() == "3") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class="wc-message wc-message-from-bot" style="width:90%">';
            insertHtml += '<div class="wc-message-content" style="width:90%;">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div class="wc-carousel slideBanner" style="width: 312px;">';
            insertHtml += '<div>';
            insertHtml += '<button class="scroll previous" id="prevBtn' + (idx) + '" style="display: none; height: 30px;" onclick="prevBtn(' + idx + ', this)">';
            insertHtml += '<img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_left_401x.png">';
            insertHtml += '</button>';
            insertHtml += '<div class="wc-hscroll-outer" >';
            insertHtml += '<div class="wc-hscroll slideDiv" style="margin-bottom: 0px;" class="content" id="slideDiv' + (idx) + '">';
            insertHtml += '<ul style="padding-left: 0px;">';
            insertHtml += '<li class="wc-carousel-item">';
            insertHtml += '<div class="wc-card hero">';
            insertHtml += '<div class="wc-container imgContainer">';
            insertHtml += '<img src="https://bot.hyundai.com/assets/images/movieImg/teasure/02_teaser.jpg">';
            insertHtml += '</div>';
            insertHtml += '<h1>' + language.Please_enter_a_title + '</h1>';
            insertHtml += '<p class="carousel">' + language.Please_enter_your_content + '</p>';
            insertHtml += '<ul class="wc-card-buttons" style="padding-left: 0px;"><li><button>BTN_1_TITLE</button></li></ul>';
            insertHtml += '</div>';
            insertHtml += '</li>';

            insertHtml += '</ul>';
            insertHtml += '</div>';
            insertHtml += '</div>';
            insertHtml += '<button class="scroll next" style="display: none; height: 30px;" id="nextBtn' + (idx) + '" onclick="nextBtn(' + idx + ', this)"><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_right_401x.png"></button>';
            insertHtml += '</div></div></div></div>';
            $(".dialogView").eq(idx).html(insertHtml);
        } else if ($(e.target).val() == "4") {
            $(".dialogView").eq(idx).html('');
            insertHtml += '<div class="wc-message wc-message-from-bot">';
            insertHtml += '<div class="wc-message-content">';
            insertHtml += '<svg class="wc-message-callout"></svg>';
            insertHtml += '<div>';
            insertHtml += '<div class="wc-carousel">';
            insertHtml += '<div>';
            insertHtml += '<button class="scroll previous" disabled=""><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_left_401x.png"></button>';
            insertHtml += '<div class="wc-hscroll-outer">';
            insertHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;">';
            insertHtml += '<ul style="padding-left: 0px;">';
            insertHtml += '<li class="wc-carousel-item wc-carousel-play">';
            insertHtml += '<div class="wc-card hero">';
            insertHtml += '<div class="wc-card-div imgContainer">';
            insertHtml += '<input type="hidden" name="dlgId" value="dlg_id"/>';
            insertHtml += '<img src="https://bot.hyundai.com/assets/images/convenience/USP_convenience_09.jpg">';
            insertHtml += '<div class="playImg"></div>';
            insertHtml += '<div class="hidden" alt="card_title"></div>';
            insertHtml += '<div class="hidden" alt="card_value"></div>';
            insertHtml += '</div>';
            insertHtml += '<h1>' + language.Please_enter_a_title + '</h1>';
            insertHtml += '<p class="dlgMediaText">' + language.Please_enter_your_content + '</p>';
            insertHtml += '<ul class="wc-card-buttons" style="padding-left: 0px;">';
            insertHtml += '<li><button>BTN_1_TITLE</button></li></ul>';
            insertHtml += '</ul>';
            insertHtml += '</div>';
            insertHtml += '</li></ul></div></div>';
            insertHtml += '<button class="scroll next" disabled=""><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_right_401x.png"></button>';
            insertHtml += '</div></div></div></div></div>';

            $(".dialogView").eq(idx).html(insertHtml);
        }
    });

    //다이얼로그 생성 - 닫는 버튼
    $('.createDlgModalClose').click(function () {
        $('#mediaCarouselLayout').css('display', 'none');
        $('#cardLayout').css('display', 'none');
        $('#appInsertForm')[0].reset();
        $('.insertForm').remove();
        $('#commonLayout hr').remove();
        $('.btnInsertDiv').each(function () {
            $(this).html("");
        })

        var insertForm = '';
        insertForm += '<div class="insertForm">';
        insertForm += '<div class="form-group" >';
        insertForm += '<form name="dialogLayout" id="dialogLayout">';
        insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span> </label>';
        insertForm += '<select class="form-control" name="dlgType">';
        insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
        insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
        insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
        insertForm += '</select>';
        insertForm += '<div class="clear-both"></div>';
        insertForm += '</form>';
        insertForm += '</div>';
        insertForm += '</div>';

        $('#apiLayout').css('display', 'none');
        $('#commonLayout').css('display', 'block');
        $('#commonLayout').prepend(insertForm);

        if ($('#btnCreateLMiddle').html() == '취소' || $('#btnCreateMiddle').html() == 'CANCEL') {

            $('#btnCreateMiddle').click();
        }
        var dialogView = '';
        dialogView += '<div class="dialogView" >';
        dialogView += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
        dialogView += '<div class="wc-message-content">';
        dialogView += '<svg class="wc-message-callout"></svg>';
        dialogView += '<div>';
        dialogView += '<div class="format-markdown">';
        dialogView += '<div class="textMent">';
        dialogView += '<h1 class="textTitle">' + language.Please_enter_a_title + '</h1>';
        dialogView += '<p>' + language.Please_enter + '</p>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        dialogView += '</div>';
        $('#dialogViewWrap').html(dialogView);
    });

    //다이얼로그 생성 모달 닫는 이벤트(초기화)
    $(".js-modal-close").click(function () {
        $('html').css({ 'overflow': 'auto', 'height': '100%' }); //scroll hidden 해제
        //$('#element').off('scroll touchmove mousewheel'); // 터치무브 및 마우스휠 스크롤 가능

        $('#appInsertDes').val('');
        $("#intentList option:eq(0)").attr("selected", "selected");
        //$('#intentList').find('option:first').attr('selected', 'selected');
        initMordal('intentList', 'Select Intent');
        initMordal('entityList', 'Select Entity');
        $('#dlgLang').find('option:first').attr('selected', 'selected');
        $('#dlgOrder').find('option:first').attr('selected', 'selected');
        $('#layoutBackground').hide();
    });
    /** 모달 끝 */

    // 다이얼로그 생성 모달 (소스 타입 변경)
    $('#sourceType').change(function (e) {
        if ($(e.target).val() == "API") {
            $('.dialogView').html('');
            $('#commonLayout').css('display', 'none');
            $('#apiLayout').css('display', 'block');
        } else {

            $('.insertForm').remove();
            var insertForm = '';
            insertForm += '<div class="insertForm">';
            insertForm += '<div class="form-group" >';
            insertForm += '<form name="dialogLayout" id="dialogLayout">';
            insertForm += '<label>' + language.DIALOG_BOX_TYPE + '<span class="nec_ico">*</span> </label>';
            insertForm += '<select class="form-control" name="dlgType">';
            insertForm += '<option value="2">' + language.TEXT_TYPE + '</option>';
            insertForm += '<option value="3">' + language.CARD_TYPE + '</option>';
            insertForm += '<option value="4">' + language.MEDIA_TYPE + '</option>';
            insertForm += '</select>';
            insertForm += '<div class="clear-both"></div>';
            insertForm += '</form>';
            insertForm += '</div>';
            insertForm += '</div>';

            $('#commonLayout').css('display', 'block');
            $('#commonLayout').prepend(insertForm);
            var dialogView = '';
            dialogView += '<div class="dialogView" >';
            dialogView += '<div class="wc-message wc-message-from-bot" style="width:80%;">';
            dialogView += '<div class="wc-message-content">';
            dialogView += '<svg class="wc-message-callout"></svg>';
            dialogView += '<div>';
            dialogView += '<div class="format-markdown">';
            dialogView += '<div class="textMent">';
            dialogView += '<p>' + language.Please_enter + '</p>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            dialogView += '</div>';
            $('#dialogViewWrap').html(dialogView);

            $('#apiLayout').css('display', 'none');
            $(".insertForm form").append($(".textLayout").clone(true));
            $('.insertForm .textLayout').css('display', 'block');
        }
    });

    // 다이얼로그 생성 모달
    $('#btnCreateMiddle').on('click', function (e) {
        if ($(this).html() == "신규" || $(this).html() == "NEW") {
            $(this).html(language.CANCEL);
            $('#middleGroupEdit').css('display', 'block');
            $('#middleGroup').css('display', 'none');
        } else {
            $(this).html(language.NEW);
            $('#middleGroupEdit').css('display', 'none');
            $('#middleGroup').css('display', 'block');
        }

        return;
    });

    $('#iptDialog').on('input', function (e) {

        if ($(this).val() !== "") {
            $(this).next().removeClass('disable');
            $(this).next().prop("disabled", false);
        } else {
            $(this).next().addClass('disable');
            $(this).next().prop("disabled", true);
        }
    });
    
});

//Banned Word List 테이블 페이지 버튼 클릭
$(document).on('click', '#smallTalkTablePaging .li_paging', function (e) {
    if (!$(this).hasClass('active')) {
        makeSmallTalkTable($(this).text());
    }
});

var searchQuestiontText = ""; //페이징시 필요한 검색어 담아두는 변수
var searchIntentText = ""; //페이징시 필요한 검색어 담아두는 변수
function makeSmallTalkTable(page) {
    if (page) {
        //$('#currentPage').val(1);
        searchQuestiontText = $('#searchQuestion').val();
        searchIntentText = $('#searchIntent').val();
    }

    params = {
        //'currentPage': ($('#currentPage').val() == '') ? 1 : $('#currentPage').val(),
        'currentPage': ($('#currentPage').val() == '') ? 1 : page,
        'searchQuestiontText': searchQuestiontText,
        'searchIntentText': searchIntentText
    };

    $.ajax({
        type: 'POST',
        data: params,
        url: '/smallTalkMng/selectSmallTalkList',
        success: function (data) {

            if (data.rows) {

                var tableHtml = "";
                for (var i = 0; i < data.rows.length; i++) {
                    tableHtml += '<tr style="cursor:pointer" name="userTr"><td>' + data.rows[i].NUM + '</td>';
                    tableHtml += '<td><input type="checkbox" class="flat-red" name="CANCEL_ST_SEQ" id="CANCEL_ST_SEQ" value="'+ data.rows[i].RELATION_ID+'"></td>';
                    tableHtml += '<td>' + data.rows[i].LUIS_INTENT + '</td>';
                    tableHtml += '<td class="txt_left tex01"><a href="#"  data-toggle="modal" data-target="#myModal2"  onclick="searchDialog(' + data.rows[i].DLG_ID+ ',' + data.rows[i].RELATION_ID+ ');return false;">' + data.rows[i].DLG_QUESTION + '</a></td>';
                    tableHtml += '</tr>';
                }

                saveTableHtml = tableHtml;
                $('#smallTalktbody').html(tableHtml);

                //사용자의 appList 출력
                $('#smallTalktbody').find('tr').eq(0).children().eq(0).trigger('click');

                $('#smallTalkTablePaging .pagination').html('').append(data.pageList);

            } else {
                saveTableHtml = '<tr><td colspan="4" class="text-center">No SmallTalk Data</td></tr>';
                $('#smallTalktbody').html(saveTableHtml);
            }

        }
    });
}

var botChatNum4Desc = 1;
//dlg 저장
var dlgMap = new Object();
function searchDialog(dlgID, relationID) {

    $insertForm = $('#commonLayout .insertForm').eq(0).clone();
    $dlgForm = $('#commonLayout .textLayout').eq(0).clone();
    $carouselForm = $('#commonLayout .carouselLayout').eq(0).clone();
    $mediaForm = $('#commonLayout .mediaLayout').eq(0).clone();

    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '</div>';

    addCarouselForm = '<div class="btn_wrap addCarouselBtnDiv" style="clear:both" >' +
        '<button type="button" class="btn btn-default addCarouselBtn">' + language.INSERT_MORE_CARDS + '</button>' +
        '</div>';

    mediaForm = '<div class="mediaLayout">' +
        '<label>' + language.IMAGE_URL + '<span class="nec_ico">*</span></label>' +
        '<input type="text" name="mediaImgUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
        '<div class="form-group">' +
        '<label>' + language.MEDIA_URL + '</label>' +
        '<input type="text" name="mediaUrl" class="form-control" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default addMediaBtn" >' + language.INSERT_MORE_BUTTON + '</button>' +
        '<div class="clear-both"></div>' +
        '</div>';

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '</label>' +
        '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '</div>';

    deleteInsertForm = '<div class="btn_wrap deleteInsertFormDiv" style="clear:both;" >' +
        '<button type="button" class="btn btn-default deleteInsertForm">' + language.DELETE_DIALOG + '</button>' +
        '</div>';

    var inputHtml = '<div><label>' + language.BUTTON + '</label></div>' +
        '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
        '<table class="cardCopyTbl" style="width:100%">' +
        '<col width="21%"><col width="1%"><col width="35%">' +
        '<col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
        '<thead><tr>' +
        '<th>' + language.Type + '</th><th></th><th>' + language.NAME + '</th>' +
        '<th></th><th>' + language.CONTENTS + '</th><th></th><th></th>' +
        '</tr></thead>' +
        '<tbody>' +
        '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr></tbody></table></div>';

    var inputTrHtml = '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr>';

    var inputMHtml = '<label>' + language.BUTTON + '</label></div>' +
        '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
        '<table class="mediaCopyTbl" style="width:100%"><col width="21%">' +
        '<col width="1%"><col width="35%"><col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
        '<thead><tr><th>' + language.Type + '</th><th></th>' +
        '<th>' + language.NAME + '</th><th></th><th>' + language.CONTENTS + '</th>' +
        '<th></th><th></th></tr></thead><tbody>' +
        '<tr><td>' +
        '<select class="form-control" name="btnType">' +
        '<option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option>' +
        '</select>' +
        '</td><td></td>' +
        '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '">' +
        '</td><td></td><td>' +
        '<input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '">' +
        '</td><td></td><td>' +
        '<a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a>' +
        '</td></tr></tbody></table></div></div></div>';

    var inputMTrHtml = '<tr>' +
        '<td>' +
        '<select class="form-control" name="btnType">' +
        '<option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option>' +
        '</select>' +
        '</td><td></td>' +
        '<td><input type="text" name="mButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="mButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr>';

    $.ajax({
        url: '/smallTalkMng/getDlgAjax',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgID': dlgID, 'relationID': relationID },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {          //성공했을 때 함수 인자 값으로 결과 값 나옴
            var inputUttrHtml = '';

            if (result['list'].length == 0) {
                inputUttrHtml += '<div style="display:table-cell;vertical-align:middle; height:400px; width:900px; text-align:center;">' +
                    language.NO_DATA +
                    '</div>';
            } else {

                var row = result['list'];

                for (var i = 0; i < row.length; i++) {
                    botChatNum4Desc++;
                    var val = row[i];

                    var tmp = val;//val[l];

                    for (var j = 0; j < tmp.dlg.length; j++) {

                        if (tmp.dlg[j].DLG_TYPE == 2) {

                            inputUttrHtml += '<div class="wc-message wc-message-from-bot" style="width:200px">';
                            inputUttrHtml += '<div class="wc-message-content">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div><div class="format-markdown"><div class="textMent">';
                            inputUttrHtml += '<p>';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += tmp.dlg[j].CARD_TEXT;
                            inputUttrHtml += '</p>';
                            inputUttrHtml += '</div></div></div></div></div>';

                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(deleteInsertForm);
                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("2").prop("selected", true);
                            $("#dialogLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            $("#dialogLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $(".insertForm .textLayout").css("display", "block");
                        } else if (tmp.dlg[j].DLG_TYPE == 3) {

                            if (j == 0) {
                                inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                                inputUttrHtml += '<div class="wc-message-content">';
                                inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                                inputUttrHtml += '<div class="wc-carousel slideBanner" style="width: 312px;">';
                                inputUttrHtml += '<div>';
                                inputUttrHtml += '<button class="scroll previous" id="prevBtn0" style="display: none;" onclick="prevBtn(0,this)">';
                                inputUttrHtml += '<img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_left_401x.png">';
                                inputUttrHtml += '</button>';
                                inputUttrHtml += '<div class="wc-hscroll-outer" >';
                                inputUttrHtml += '<div class="wc-hscroll slideDiv" style="margin-bottom: 0px;" class="content" id="slideDiv0">';
                                inputUttrHtml += '<ul>';
                                //inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            }
                            inputUttrHtml += '<li class="wc-carousel-item">';
                            inputUttrHtml += '<div class="wc-card hero">';
                            inputUttrHtml += '<div class="wc-container imgContainer" >';
                            inputUttrHtml += '<img src="' + tmp.dlg[j].IMG_URL + '">';
                            inputUttrHtml += '</div>';
                            if (tmp.dlg[j].CARD_TITLE != null) {
                                inputUttrHtml += '<h1>' + /*cardtitle*/ tmp.dlg[j].CARD_TITLE + '</h1>';
                            }
                            if (tmp.dlg[j].CARD_TEXT != null) {

                                inputUttrHtml += '<p class="carousel" style="height:20px;min-height:20px;">' + /*cardtext*/ tmp.dlg[j].CARD_TEXT + '</p>';
                            }
                            if (tmp.dlg[j].BTN_1_TITLE != null) {
                                inputUttrHtml += '<ul class="wc-card-buttons"><li><button>' + /*btntitle*/ tmp.dlg[j].BTN_1_TITLE + '</button></li></ul>';
                            }
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</li>';

                            //다이얼로그가 한개일때에는 오른쪽 버튼 x
                            if ((tmp.dlg.length - 1) == j) {
                                inputUttrHtml += '</ul>';
                                inputUttrHtml += '</div>';
                                inputUttrHtml += '</div>';
                                if ((tmp.dlg.length) > 2) {
                                    inputUttrHtml += '<button class="scroll next" style="display: block; height: 30px;" id="nextBtn0" onclick="nextBtn(0,this)"><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_right_401x.png"></button>';
                                } else {
                                    inputUttrHtml += '<button class="scroll next" style="display: none; height: 30px;" id="nextBtn0" onclick="nextBtn(0,this)"><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_right_401x.png"></button>';
                                }
                                inputUttrHtml += '</div></div></div></div>';
                            }

                            if (j != 0) {
                                $(".insertForm form").append('<div class="clear-both"></div>');
                            }
                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(carouselForm);

                            if ((tmp.dlg.length - 1) == j) {
                                $("#dialogLayout").find(".carouselLayout").eq(j).after(addCarouselForm);
                                $("#dialogLayout").find(".addCarouselBtnDiv").after(deleteInsertForm);
                            }

                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("3").prop("selected", true);
                            $("#dialogLayout").find(".textLayout").eq(j).css("display", "block");
                            $("#dialogLayout").find(".carouselLayout").eq(j).css("display", "block");

                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);
                            $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=imgUrl]").val(tmp.dlg[j].IMG_URL);

                            if (tmp.dlg[j].BTN_1_TYPE != null && tmp.dlg[j].BTN_1_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".btnInsertDiv").append(inputHtml);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(0)").val(tmp.dlg[j].BTN_1_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(0)").val(tmp.dlg[j].BTN_1_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(0)").val(tmp.dlg[j].BTN_1_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_2_TYPE != null && tmp.dlg[j].BTN_2_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".cardCopyTbl tbody").append(inputTrHtml);

                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(1)").val(tmp.dlg[j].BTN_2_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(1)").val(tmp.dlg[j].BTN_2_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(1)").val(tmp.dlg[j].BTN_2_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_3_TYPE != null && tmp.dlg[j].BTN_3_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".cardCopyTbl tbody").append(inputTrHtml);

                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(2)").val(tmp.dlg[j].BTN_3_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(2)").val(tmp.dlg[j].BTN_3_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(2)").val(tmp.dlg[j].BTN_3_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_4_TYPE != null && tmp.dlg[j].BTN_4_TYPE != "") {
                                $("#dialogLayout").find(".carouselLayout").eq(j).find(".cardCopyTbl tbody").append(inputTrHtml);

                                $("#dialogLayout").find(".carouselLayout").eq(j).find("select[name=btnType]:eq(3)").val(tmp.dlg[j].BTN_4_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonName]:eq(3)").val(tmp.dlg[j].BTN_4_TITLE);
                                $("#dialogLayout").find(".carouselLayout").eq(j).find("input[name=cButtonContent]:eq(3)").val(tmp.dlg[j].BTN_4_CONTEXT);
                            }
                        } else if (tmp.dlg[j].DLG_TYPE == 4) {
                            inputUttrHtml += '<div class="wc-message wc-message-from-bot">';
                            inputUttrHtml += '<div class="wc-message-content">';
                            inputUttrHtml += '<svg class="wc-message-callout"></svg>';
                            inputUttrHtml += '<div>';
                            inputUttrHtml += '<div class="wc-carousel">';
                            inputUttrHtml += '<div>';
                            inputUttrHtml += '<button class="scroll previous" disabled=""><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_left_401x.png"></button>';
                            inputUttrHtml += '<div class="wc-hscroll-outer">';
                            inputUttrHtml += '<div class="wc-hscroll" style="margin-bottom: 0px;">';
                            inputUttrHtml += '<ul style="min-width:0px">';
                            inputUttrHtml += '<li class="wc-carousel-item wc-carousel-play">';
                            inputUttrHtml += '<div class="wc-card hero" style="width:70%">';
                            inputUttrHtml += '<div class="wc-card-div imgContainer">';
                            inputUttrHtml += '<input type="hidden" name="dlgId" value="' + tmp.dlg[j].DLG_ID + '"/>';
                            inputUttrHtml += '<img src="' + /* 이미지 url */ tmp.dlg[j].MEDIA_URL + '">';
                            inputUttrHtml += '<div class="playImg"></div>';
                            inputUttrHtml += '<div class="hidden" alt="' + tmp.dlg[j].CARD_TITLE + '"></div>';
                            inputUttrHtml += '<div class="hidden" alt="' + /* media url */ tmp.dlg[j].CARD_VALUE + '"></div>';
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '<h1>' + /* title */ tmp.dlg[j].CARD_TITLE + '</h1>';
                            inputUttrHtml += '<ul class="wc-card-buttons">';
                            inputUttrHtml += '</ul>';
                            inputUttrHtml += '</div>';
                            inputUttrHtml += '</li></ul></div></div>';
                            inputUttrHtml += '<button class="scroll next" disabled=""><img src="https://bot.hyundai.com/assets/images/02_contents_carousel_btn_right_401x.png"></button>';
                            inputUttrHtml += '</div></div></div></div></div>';

                            $(".insertForm form").append(dlgForm);
                            $(".insertForm form").append(mediaForm);
                            $("#dialogLayout .mediaLayout").after(deleteInsertForm);
                            $("#dialogLayout").eq(j).find("select[name=dlgType]").val("4").prop("selected", true);
                            $("#dialogLayout").find(".textLayout").eq(j).css("display", "block");
                            $("#dialogLayout").find(".mediaLayout").eq(j).css("display", "block");

                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogTitle]").val(tmp.dlg[j].CARD_TITLE);
                            $("#dialogLayout").find(".textLayout").eq(j).find("input[name=dialogText]").val(tmp.dlg[j].CARD_TEXT);

                            $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mediaImgUrl]").val(tmp.dlg[j].MEDIA_URL);
                            $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mediaUrl]").val(tmp.dlg[j].CARD_VALUE);

                            if (tmp.dlg[j].BTN_1_TYPE != null && tmp.dlg[j].BTN_1_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".btnInsertDiv").append(inputMHtml);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(0)").val(tmp.dlg[j].BTN_1_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(0)").val(tmp.dlg[j].BTN_1_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(0)").val(tmp.dlg[j].BTN_1_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_2_TYPE != null && tmp.dlg[j].BTN_2_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".mediaCopyTbl tbody").append(inputMTrHtml);

                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(1)").val(tmp.dlg[j].BTN_2_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(1)").val(tmp.dlg[j].BTN_2_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(1)").val(tmp.dlg[j].BTN_2_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_3_TYPE != null && tmp.dlg[j].BTN_3_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".mediaCopyTbl tbody").append(inputMTrHtml);

                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(2)").val(tmp.dlg[j].BTN_3_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(2)").val(tmp.dlg[j].BTN_3_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(2)").val(tmp.dlg[j].BTN_3_CONTEXT);
                            }
                            if (tmp.dlg[j].BTN_4_TYPE != null && tmp.dlg[j].BTN_4_TYPE != "") {
                                $("#dialogLayout").find(".mediaLayout").eq(j).find(".mediaCopyTbl tbody").append(inputMTrHtml);

                                $("#dialogLayout").find(".mediaLayout").eq(j).find("select[name=btnType]:eq(3)").val(tmp.dlg[j].BTN_4_TYPE).prop("selected", true);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonName]:eq(3)").val(tmp.dlg[j].BTN_4_TITLE);
                                $("#dialogLayout").find(".mediaLayout").eq(j).find("input[name=mButtonContent]:eq(3)").val(tmp.dlg[j].BTN_4_CONTEXT);
                            }

                        }
                        $('#updateDlgId').val(tmp.dlg[j].DLG_ID);
                        $('#updateDlgType').val(tmp.dlg[j].DLG_TYPE);
                        $('#updateDlgEntity').val(tmp.GROUPS);
                    }
                }
            }
            var relation_intent;
            var relation_question;
            for (var jj = 0; jj < result['list'][0].DLG_RELATION.length; jj++) {
                            relation_intent = result['list'][0].DLG_RELATION[jj].LUIS_INTENT;
                           relation_question = result['list'][0].DLG_RELATION[jj].DLG_QUESTION;
                       }
            
            $('.dialogView').html(inputUttrHtml);

            //대화상자 수정 추가
            //$('h4#myModalLabel.modal-title').text(language.UPDATE_DIALOG_BOX);
            $('h4#myModalLabel.modal-title').text("SmallTalk 대화상자");
            $('#description').val(result['list'][0].DLG_DESCRIPTION);
            $("#largeGroup").val(result['list'][0].GROUPL);
            $("#middleGroup").val(result['list'][0].GROUPM);

            $('#dlgQuestion').text(relation_question);
            $('#luisIntent').text(relation_intent);
            $("#createDialog").attr('onclick', 'updateDialog()');
        }


    }); // ------      ajax 끝-----------------

}


function updateDialog() {

    var dlgId = $('#updateDlgId').val();
    var dlgType = $('#updateDlgType').val();
    var entity = $('#updateDlgEntity').val();

    var idx = $('form[name=dialogLayout]').length;
    var array = [];
    var exit = false;
    /*
    if ($('#description').val().trim() === "") {
        alert(language.Description_must_be_entered);
        return false;
    }
*/
    $('.insertForm textarea[name=dialogText]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.You_must_enter_a_Dialog_Title);
            exit = true;
            return false;
        }
    });
    if (exit) return;
    $('.insertForm input[name=imgUrl]').each(function (index) {
        if ($(this).val().trim() === "") {
            alert(language.ImageURL_must_be_entered);
            exit = true;
            return false;
        }
    });
    if (exit) return;


    for (var i = 0; i < idx; i++) {
        var tmp = $("form[name=dialogLayout]").eq(i).serializeArray();
        var object = {};
        var carouselArr = [];
        var objectCarousel = {};
        if (tmp[0].value === "3") {
            var btnTypeCount = 1;
            var cButtonContentCount = 1;
            var cButtonNameCount = 1;
            for (var j = 1; j < tmp.length; j++) {
                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                    if (btnTypeCount == 5) {
                        btnTypeCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonContent') {
                    tmp[j].name = 'cButtonContent' + (cButtonContentCount++);
                    if (cButtonContentCount == 5) {
                        cButtonContentCount = 1;
                    }
                }
                if (tmp[j].name == 'cButtonName') {
                    tmp[j].name = 'cButtonName' + (cButtonNameCount++);
                    if (cButtonNameCount == 5) {
                        cButtonNameCount = 1;
                    }
                }

                if (typeof objectCarousel[tmp[j].name] !== "undefined") {
                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    btnTypeCount = 1;
                    cButtonContentCount = 1;
                    cButtonNameCount = 1;
                }

                if (j === tmp.length - 1) {
                    object[tmp[0].name] = tmp[0].value;
                    objectCarousel[tmp[j].name] = tmp[j].value;

                    carouselArr.push(objectCarousel);
                    objectCarousel = {};
                    break;
                }
                object[tmp[0].name] = tmp[0].value;
                objectCarousel[tmp[j].name] = tmp[j].value;
            }
            //carouselArr.push(objectCarousel);
            object['carouselArr'] = carouselArr;
        } else if (tmp[0].value === "4") {

            var btnTypeCount = 1;
            var mButtonContentCount = 1;
            var mButtonNameCount = 1;

            for (var j = 0; j < tmp.length; j++) {

                if (tmp[j].name == 'btnType') {
                    tmp[j].name = 'btn' + (btnTypeCount++) + 'Type';
                }
                if (tmp[j].name == 'mButtonContent') {
                    tmp[j].name = 'mButtonContent' + (mButtonContentCount++);

                }
                if (tmp[j].name == 'mButtonName') {
                    tmp[j].name = 'mButtonName' + (mButtonNameCount++);
                }

                object[tmp[j].name] = tmp[j].value;
            }

        } else {
            for (var j = 0; j < tmp.length; j++) {
                object[tmp[j].name] = tmp[j].value;
            }
        }

        array[i] = JSON.stringify(object);//JSON.stringify(tmp);//tmp.substring(1, tmp.length-2);
    }
    
    array[array.length] = JSON.stringify($("form[name=appInsertForm]").serializeObject());//JSON.stringify($("form[name=appInsertForm]"));

    $.ajax({
        url: '/smallTalkMng/updateDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': dlgId, 'dlgType': dlgType, 'updateData': array, 'entity': entity },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            alert('success');
            $('.createDlgModalClose').click();

            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
        }

    });
}

function deleteDialog(dlgId) {
    $.ajax({
        url: '/learning/deleteDialog',                //주소
        dataType: 'json',                  //데이터 형식
        type: 'POST',                      //전송 타입
        data: { 'dlgId': dlgId },      //데이터를 json 형식, 객체형식으로 전송

        success: function (result) {
            alert('delele complete');
            $('.createDlgModalClose').click();
            var groupType = $('.selected').text();
            var sourceType = $('#tblSourceType').val();
            selectDlgByTxt(groupType, sourceType);
        }

    });
}

//다이얼로그 생성 유효성 검사
function dialogValidation(type) {
    if (type == 'dialogInsert') {
        var dialogText = $('#dialogText').val();

        if (dialogText != "") {
            $('#btnAddDlg').removeClass("disable");
            $('#btnAddDlg').attr("disabled", false);
        } else {
            $('#btnAddDlg').attr("disabled", "disabled");
            $('#btnAddDlg').addClass("disable");
        }
    }
}

// 다이얼로그 생성 모달 (다이얼로그 타이틀 입력)
function writeDialogTitle(e) {

    //var idx = $('input[name=dialogTitle]').index(e);
    var idx = $('#commonLayout .insertForm').index($(e).parents('.insertForm'));
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    var jcx = $(e).parents('.insertForm').find('input[name=dialogTitle]').index(e);

    if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 3) {
        //$('.dialogView:eq(' + idx + ') .carousel').html(e.value);
        $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('h1').text(e.value);
    } else if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 4) {
        $('.dialogView').children().eq(icx).find('h1').html(e.value);
        //$('.dialogView h1').eq(idx).html(e.value);
    } else {
        $('.dialogView').children().eq(icx).find('.textMent .textTitle').html(e.value);
    }
}

function writeCarouselImg(e) {
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    var jcx = $(e).parents('.insertForm').find('input[name=imgUrl]').index(e);

    $('#dialogPreview').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('.imgContainer img').attr("src", e.value);
}

// 다이얼로그 생성 모달 (다이얼로그 내용 입력)
function writeDialog(e) {
    //var idx = $('textarea[name=dialogText]').index(e);

    var idx = $('#commonLayout .insertForm').index($(e).parents('.insertForm'));
    var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
    //var jcx = $(e).parents('.insertForm').find('input[name=dialogTitle]').index(e);

    if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 3) {
        //$('.dialogView:eq(' + idx + ') .carousel').html(e.value);
        //var icx = $('#commonLayout').find('.insertForm').index($(e).parents('.insertForm'));
        var jcx = $(e).parents('.insertForm').find('input[name=dialogText]').index(e);
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('h1').text('');
        }
        $('.dialogView').children().eq(icx).find('ul:eq(0)').children().eq(jcx).find('p').text(e.value);


    } else if ($(e).parents('.insertForm').find('select[name=dlgType]').val() == 4) {
        $('.dialogView h1').eq(idx).text(e.value);
    } else {
        //$('.dialogView .textMent p:eq(' + idx + ')').html(e.value);
        //$('.dialogView').children().eq(icx).find('.textMent p:eq(' + idx + ')').html(e.value);
        if ($(e).parent().prev().find('input[name=dialogTitle]').val() == '') {
            $('.dialogView').children().eq(icx).find('.textMent .textTitle').text('');
        }
        $('.dialogView').children().eq(icx).find('.textMent p').text(e.value);
    }

}

//다이얼로그생성모달 - 다이얼로그삭제
$(document).on('click', '.deleteInsertForm', function (e) {

    insertFormLength = $('.insertForm').length;
    if (insertFormLength == 1) {
        alert(language.You_must_have_one_dialog_by_default);
    } else {
        var idx = $(".deleteInsertForm").index(this);
        if (idx == 0) {

            $(this).parents('.insertForm').next().remove();
        }
        $(".dialogView").eq(idx).remove();
        $(this).parents('.insertForm').prev().remove();
        $(this).parents('.insertForm').remove();
    }
    $(this).parents('.insertForm');
});

//다이얼로그생성모달 - 카드삭제 
$(document).on('click', '.deleteCard', function (e) {

    var insertFormIdx;
    $('.insertForm').each(function (count) {
        if ($(this)[0] == $(e.target).parents('#commonLayout').find($('.insertForm').find(e.target).parents('.insertForm'))[0]) {
            insertFormIdx = count;
        }
    })
    insertFormLength = $('.insertForm').length;
    //insertFormIdx = $('.insertForm').index();
    var carouselLayoutLength = $(this).parents('form[name=dialogLayout]').find('.carouselLayout').length;
    var idx = $(this).parents('form[name=dialogLayout]').find('.carouselLayout').find('.deleteCard').index(this);

    if (insertFormLength == 1) {

        if (carouselLayoutLength == 1) {
            alert(language.You_must_have_at_least_one_card);

        } else {

            if ($('.dialogView').eq(insertFormIdx).find('.slideDiv .wc-carousel-item').length == 3) {
                $('.dialogView').eq(insertFormIdx).find('.next').hide();
                $('.dialogView').eq(insertFormIdx).find('.previous').hide();
            }

            $(".dialogView").eq(insertFormIdx).find('.slideDiv .wc-carousel-item').eq(idx).remove();
            $(this).parent().parent().prev().remove();
            $(this).parent().parent().remove();
        }

    } else {

        if (carouselLayoutLength == 1) {
            alert(language.You_must_have_at_least_one_card);
        } else {

            if ($('.dialogView').eq(insertFormIdx).find('.slideDiv .wc-carousel-item').length == 3) {
                $('.dialogView').eq(insertFormIdx).find('.next').hide();
                $('.dialogView').eq(insertFormIdx).find('.previous').hide();
            }

            $(".dialogView").eq(insertFormIdx).find('.slideDiv .wc-carousel-item').eq(idx).remove();
            $(this).parent().parent().prev().prev().remove();
            $(this).parent().parent().prev().remove();
            $(this).parent().parent().remove();
        }

    }

});

//다이얼로그생성모달 - 버튼삭제
$(document).on('click', '.btn_delete', function (e) {

    var trLength = $(this).parents('tbody').children().length;
    if (trLength == 1) {
        $(this).parents('.btnInsertDiv').html('');
        return;
    }
    $(this).parent().parent().remove();
});

//다이얼로그생성모달 - 버튼추가
$(document).on('click', '.carouseBtn', function (e) {

    var inputHtml = '<div><label>' + language.BUTTON + '</label></div>' +
        '<div class="form-group col-md-13"  style="padding-left:0; margin-top: 0px;">' +
        '<table class="cardCopyTbl" style="width:100%">' +
        '<col width="21%"><col width="1%"><col width="35%">' +
        '<col width="1%"><col width="35%"><col width="1%"><col width="6%">' +
        '<thead><tr>' +
        '<th>' + language.Type + '</th><th></th><th>' + language.NAME + '</th>' +
        '<th></th><th>' + language.CONTENTS + '</th><th></th><th></th>' +
        '</tr></thead>' +
        '<tbody>' +
        '<tr>' +
        '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
        '<option value="openURL">openURL</option></select></td>' +
        '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
        '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
        '</tr></tbody></table></div>';

    $btnInsertDiv = $(this).parent().prev().prev().prev();
    if ($btnInsertDiv.children().length == 0) {
        $btnInsertDiv.html(inputHtml);
        return;
    }
    var trLength = $(this).parent().prev().prev().prev().find('.cardCopyTbl tbody tr').length;
    if (trLength >= 1 && trLength < 4) {

        var inputTrHtml = '<tr>' +
            '<td><select class="form-control" name="btnType"><option value="imBack" selected>imBack</option>' +
            '<option value="openURL">openURL</option></select></td>' +
            '<td></td><td><input type="text" name="cButtonName" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
            '<td></td><td><input type="text" name="cButtonContent" class="form-control" placeholder="' + language.Please_enter + '"></td>' +
            '<td></td><td><a href="#" class="btn_delete" style="margin:0px;"><span class="fa fa-trash"></span></a></td>' +
            '</tr>'
        $(this).parent().prev().prev().prev().find('.cardCopyTbl tbody').append(inputTrHtml);
    } else {
        alert("버튼은 4개까지 추가할 수 있습니다.");
    }

});

//다이얼로그생성모달 - 카드추가 복사본!!
$(document).on('click', '.addCarouselBtn', function (e) {
    //var $newInsertForm = $insertForm.clone();
    //var $newDlgForm = $dlgForm.clone();
    //var $newCarouselForm = $carouselForm.clone();

    dlgForm = '<div class="textLayout">' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_TITLE + '</label>' +
        '<input type="text" name="dialogTitle" class="form-control" onkeyup="writeDialogTitle(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="form-group">' +
        '<label>' + language.DIALOG_BOX_CONTENTS + '<span class="nec_ico">*</span></label>' +
        '<input type="text" name="dialogText" class="form-control" onkeyup="writeDialog(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '</div>';

    carouselForm = '<div class="carouselLayout">' +
        '<div class="form-group">' +
        '<label>' + language.IMAGE_URL + '</label>' +
        '<input type="text" name="imgUrl" class="form-control" onkeyup="writeCarouselImg(this);" placeholder="' + language.Please_enter + '">' +
        '</div>' +
        '<div class="modal_con btnInsertDiv">' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default deleteCard">' + language.DELETE_CARD + '</button>' +
        '</div>' +
        '<div class="btn_wrap" style="clear:both" >' +
        '<button type="button" class="btn btn-default carouseBtn">' + language.INSERT_MORE_BUTTON + '</button>' +
        '</div>' +
        '<div class="clear-both"></div>' +
        '</div>';

    if ($(this).parents('.insertForm').find('.carouselLayout').length == 10) {
        alert(language.Up_to_10_cards_can_be_added);
    } else {
        var idx = $(".addCarouselBtn:visible").index(this);
        var jdx = $('select[name=dlgType]').index(($(".addCarouselBtn:visible").eq(idx).parents('form[name=dialogLayout]').find('select[name=dlgType]')));
        //$('.addCarouselBtn').eq(0).parent().parent().remove();
        //$(this).parents('.insertForm').after( $newInsertForm);  
        //<div id="textLayout" style="display: block;">  </div>
        //var caraousHtml = '<div class="carouselLayout" style="display: block;">' + $carouselForm.html() + '</div>';
        var dlgFormHtml = '<div class="textLayout" style="display: block;">' + dlgForm + '</div>';
        $(this).parent().before('<div class="clear-both"></div>').before(dlgFormHtml).before(carouselForm);
        //$(this).parents('form[name=dialogLayout] .deleteInsertFormDiv').before('<div class="clear-both"></div>').after(dlgFormHtml).append(carouselForm);
        //$(this).parents('.insertForm').next().find('.clear-both').after($newDlgForm);
        var claerLen = $(this).parents('form[name=dialogLayout]').children('.clear-both').length - 1;
        $(this).parents('form[name=dialogLayout]').children('.clear-both').eq(claerLen).next().css('display', 'block');
        $(this).parents('form[name=dialogLayout]').children('.clear-both').eq(claerLen).next().next().css('display', 'block');
        //$(this).parent().parent().remove();
        //$(this).parent().css('display', 'none');
        $(this).parents('form[name=dialogLayout]').find('.addCarouselBtn:last').closest('div').css('display', 'inline-block');

        var inputUttrHtml = '<li class="wc-carousel-item">';
        inputUttrHtml += '<div class="wc-card hero">';
        inputUttrHtml += '<div class="wc-container imgContainer" >';
        inputUttrHtml += '<img src="https://bot.hyundai.com/assets/images/movieImg/teasure/02_teaser.jpg">';
        inputUttrHtml += '</div>';
        inputUttrHtml += '<h1>CARD_TITLE</h1>';
        inputUttrHtml += '<p class="carousel">CARD_TEXT</p>';
        inputUttrHtml += '<ul class="wc-card-buttons" style="padding-left:0px;"><li><button>BTN_1_TITLE</button></li></ul>';
        inputUttrHtml += '</div>';
        inputUttrHtml += '</li>';

        var kdx = $('.insertForm').index($(this).parents('.insertForm'));

        $('.dialogView').eq(jdx).find('#slideDiv' + kdx).children().append(inputUttrHtml);

        if ($('.dialogView').eq(jdx).find('#slideDiv' + kdx).children().children().length > 2) {
            $('#nextBtn' + jdx).show();
        }
    }
});

function cancelSmallTalkProc(procType) {
    var saveArr = new Array();
    var data = new Object();
    data.statusFlag = procType;
    //data.DEL_SEQ = $('#DEL_SEQ').val();
    $("input[name=CANCEL_ST_SEQ]:checked").each(function() {
        var test = $(this).val();
        console.log(test);
        data.CANCEL_ST_SEQ = test;
    });
    saveArr.push(data);
 
    var jsonData = JSON.stringify(saveArr);
    var params = {
        'saveArr': jsonData
    };
    $.ajax({
        type: 'POST',
        datatype: "JSON",
        data: params,
        url: '/smallTalkMng/cancelSmallTalkProc',
        success: function (data) {
            if (data.status === 200) {
                alert(language['REGIST_SUCC']);
                window.location.reload();
            } else {
                alert(language['It_failed']);
            }
        }
    });
}