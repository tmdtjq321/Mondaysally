const jwtMiddleware = require("../../../config/jwtMiddleware");
const twinkleProvider = require("../../app/Twinkle/twinkleProvider");
const twinkleService = require("../../app/Twinkle/twinkleService");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const { emit } = require("nodemon");

exports.getTwinkle = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const page = req.query.page;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    if (!page)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_NONE));

    const result = await twinkleProvider.selectTwinkleProve(page, idx);

    if (page != 1 && result.length == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    logger.info(logmessage('미증빙/증빙 기프트 리스트 조회','/prove user',idx));
    return res.send(response(baseResponse.SUCCESS, { 'giftLogs': result }));
};

exports.getTwinklelist = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const page = req.query.page;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    if (!page)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_NONE));

    const result = await twinkleProvider.selectTwinkleList(idx, page, companyIdx);

    if (page != 1 && result.twinkles.length == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    logger.info(logmessage('트윙클 리스트 조회','/twinkle user',idx));
    return res.send(response(baseResponse.SUCCESS, result));
};

exports.postTwinkle = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const { giftLogIdx, content, receiptImgUrl, twinkleImgList } = req.body;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    if (!giftLogIdx)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOG_EMPTY));

    const chk = await twinkleProvider.giftLogChk(giftLogIdx);

    if (!chk || chk.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOG_WRONG));

    if (chk.memberIdx != idx)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NOT));

    if (!content)
        return res.send(errResponse(baseResponse.SIGNUP_CONTENT_EMPTY));

    if (!receiptImgUrl)
        return res.send(errResponse(baseResponse.SIGNUP_RECEIPT_EMPTY));

    if (!twinkleImgList)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLEIMG_EMPTY));

    if (twinkleImgList.length === 0)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLEIMG_EMPTY));

    if (content.length > 1000 || content.length < 1)
        return res.send(errResponse(baseResponse.SIGNUP_CONTENT_WRONG));

    if (twinkleImgList.length > 3)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLEIMG_WRONG));

    const result = await twinkleService.postTwinkles(idx, giftLogIdx, content,
        receiptImgUrl, twinkleImgList);

    logger.info(logmessage('트윙클 생성','POST /twinkle user',idx));
    return res.send(result);
};

exports.postTwinkleLike = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const twinkleID = req.params.idx;

    if (!twinkleID)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NONE));

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const twinklechk = await twinkleProvider.twinkleCheck(twinkleID);

    if (!twinklechk)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NONE));

    if (twinklechk.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_DEL));

    const result = await twinkleService.postTwinklelikes(twinklechk.isAos,twinklechk.firebaseToken,nickname,twinkleID, idx);

    logger.info(logmessage('좋아요 생성','POST /like user',idx));
    return res.send(result);
};

exports.getTwinkleID = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const twinkleIdx = req.params.idx;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const twinklechk = await twinkleProvider.twinkleCheck(twinkleIdx);

    if (!twinklechk)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NONE));

    var isPrivated = 'N';

    if (twinklechk.status != 'ACTIVE'){
        isPrivated = 'Y';
    }

    const result = await twinkleProvider.selectTwinklebyID(twinkleIdx, idx);
    result.isPrivated = isPrivated;

    logger.info(logmessage('트윙클 조회','/twinkle/:twinkleIdx user',idx));
    return res.send(response(baseResponse.SUCCESS, result));
};

exports.delTwinkleID = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const twinkleIdx = req.params.idx;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const twinklechk = await twinkleProvider.twinkleCheck(twinkleIdx);

    if (!twinklechk)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NONE));

    if (twinklechk.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_DEL));

    if (twinklechk.memberIdx != idx)
        return res.send(errResponse(baseResponse.SIGNUP_WRITER_NONE));

    const result = await twinkleService.delTwinklebyID(twinkleIdx);

    logger.info(logmessage('트윙클 삭제','/twinkle/out/:twinkleIdx user',idx));
    return res.send(result);
};

exports.updateTwinkleID = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const twinkleIdx = req.params.idx;
    const { content, receiptImgUrl, updateTwinkleImgList } = req.body;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const twinklechk = await twinkleProvider.twinkleCheck(twinkleIdx);

    if (twinklechk.isAccepted != 'Y' && !updateTwinkleImgList)
        return res.send(errResponse(baseResponse.SIGNUP_IMG_UPDATE));

    if (!twinklechk)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NONE));

    if (twinklechk.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_DEL));

    if (twinklechk.memberIdx != idx)
        return res.send(errResponse(baseResponse.SIGNUP_WRITER_NONE));

    if (!content)
        return res.send(errResponse(baseResponse.SIGNUP_CONTENT_EMPTY));

    if (!receiptImgUrl)
        return res.send(errResponse(baseResponse.SIGNUP_RECEIPT_EMPTY));

    if (content.length > 1000 || content.length < 1)
        return res.send(errResponse(baseResponse.SIGNUP_CONTENT_WRONG));

    if (!Array.isArray(updateTwinkleImgList))
        return res.send(errResponse(baseResponse.SIGNUP_ADMIN_NOW));

    if (updateTwinkleImgList.length > 3)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLEIMG_WRONG));

    const result = await twinkleService.updateTwinklebyID(twinklechk.isAccepted, twinkleIdx, content,
        receiptImgUrl, updateTwinkleImgList);

    logger.info(logmessage('트윙클 수정','PATCH /twinkle/:twinkleIdx user',idx));
    return res.send(result);
};

exports.postComment = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const twinkleIdx = req.params.idx;
    const { content } = req.body;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const twinklechk = await twinkleProvider.twinkleCheck(twinkleIdx);

    if (!twinklechk)
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_NONE));

    if (twinklechk.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_TWINKLE_DEL));

    if (!content)
        return res.send(errResponse(baseResponse.SIGNUP_COMMENT_TEXT));

    if (content.length > 1000 || content.length < 1)
        return res.send(errResponse(baseResponse.SIGNUP_COMMENT_WRONG));

    const result = await twinkleService.insertComment(twinklechk.isAos,twinklechk.firebaseToken,chkID.nickname,twinkleIdx, idx, content);

    logger.info(logmessage('댓글 생성','POST /comment/:twinkleIdx user',idx));
    return res.send(result);
};

exports.delComment = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const commentID = req.params.idx;

    const chkID = await twinkleProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const result = await twinkleService.delComment(idx, commentID);
    logger.info(logmessage('댓글 삭제','PATCH /comment/:commentIdx user',idx));

    return res.send(result);
};

