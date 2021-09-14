const jwtMiddleware = require("../../../config/jwtMiddleware");
const cloverProvider = require("../../app/Clover/cloverProvider");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const { emit } = require("nodemon");

exports.getClover = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const page = req.query.page;
    const type = req.query.type;

    const chkID = await cloverProvider.IDCheck(idx);

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

    if (!type)
        return res.send(errResponse(baseResponse.SIGNUP_TYPE_NONE))

    if (!(type == 'accumulate' || type == 'used' || type == 'current'))
        return res.send(errResponse(baseResponse.SIGNUP_TYPE_WRONG));

    var obj = {};
    if (type == "accumulate") {
        obj.accumulatedClover = chkID.accumulatedClover;
    }
    else if (type == "used") {
        obj.usedClover = chkID.accumulatedClover - chkID.currentClover;
    }
    else if (type == "current") {
        obj.currentClover = chkID.currentClover;
    }

    if (page == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    const results = await cloverProvider.selectCloverList(chkID.currentClover, type, page, idx, companyIdx);

    if (page != 1 && results.length == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    if (type == 'accumulate' || type == 'used') {
        obj.clovers = results;
    }
    else {
        obj.gifts = results;
    }

    logger.info(logmessage('클로버 리스트 조회',`/clover type : ${type} user`,idx));
    return res.send(response(baseResponse.SUCCESS, obj));
};

exports.getCloverRank = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;
    const page = req.query.page;

    const chkID = await cloverProvider.IDCheck(idx);

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

    const result = await cloverProvider.selectCloverRank(page,companyIdx);

    if (page != 1 && result.length == 0)
        return res.send(errResponse(baseResponse.SIGNUP_PAGE_WRONG));

    logger.info(logmessage('트윙클 랭킹','/rank user',idx));
    return res.send(response(baseResponse.SUCCESS, { 'ranks': result }));
};
