const jwtMiddleware = require("../../../config/jwtMiddleware");
const homeProvider = require("../../app/Home/homeProvider");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const { emit } = require("nodemon");

exports.getMain = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;

    const chkID = await homeProvider.IDCheck(idx);

    chkID.totalWorkTime = parseInt(chkID.totalWorkTime);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const giftHistory = await homeProvider.getGiftHistory(idx);
    chkID.giftHistory = giftHistory;

    const homeRank = await homeProvider.getRank(companyIdx);
    for (let i = 0; i < homeRank.length; i++){
        homeRank[i].ranking = i+1;
    }
    chkID.twinkleRank = homeRank;

    const Response = await homeProvider.getHome(companyIdx);

    chkID.workingMemberlist = Response;

    logger.info(logmessage('홈 화면','/main user',idx));
    return res.send(response(baseResponse.SUCCESS, chkID));
};

