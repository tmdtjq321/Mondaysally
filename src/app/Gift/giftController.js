const jwtMiddleware = require("../../../config/jwtMiddleware");
const giftProvider = require("../../app/Gift/giftProvider");
const giftService = require("../../app/Gift/giftService");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const regexEmail = require("regex-email");
const { emit } = require("nodemon");

exports.getGiftlist = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const page = req.query.page;

    const chkID = await giftProvider.IDCheck(idx);

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

    const result = await giftProvider.selectGifInfo(companyIdx, page);

    if (page != 1 && result.gifts.length == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    logger.info(logmessage('기프트 리스트 조회','/gift user',idx));
    return res.send(response(baseResponse.SUCCESS, result));
};

exports.getGiftbyID = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const giftID = req.params.idx;

    const chkID = await giftProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const Response = await giftProvider.selectGifInfonyID(giftID);

    if (!Response)
        return res.send(errResponse(baseResponse.SIGNUP_GIFT_NONE));

    logger.info(logmessage('기프트 조회','/gift/:giftIdx user',idx));
    return res.send(response(baseResponse.SUCCESS, Response));
};

exports.postGiftOrder = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const { giftIdx, usedClover } = req.body;

    const chkID = await giftProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const result = await giftService.postGiftOrders(chkID.currentClover, giftIdx, usedClover, idx);

    logger.info(logmessage('기프트 신청','POST /gift user',idx));
    return res.send(result);
};

exports.getGiftLog = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const page = req.query.page;

    const chkID = await giftProvider.IDCheck(idx);

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

    const result = await giftProvider.selectGiftLoglist(idx, page);

    if (page != 1 && result.giftLogs.length == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    logger.info(logmessage('신청한 기프트 리스트 조회','/giftlog user',idx));
    return res.send(response(baseResponse.SUCCESS, result));
};

