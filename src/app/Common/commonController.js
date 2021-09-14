const jwtMiddleware = require("../../../config/jwtMiddleware");
const commonProvider = require("../../app/Common/commonProvider");
const commonService = require("../../app/Common/commonService");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const { emit } = require("nodemon");

exports.getTest = async function (req, res) {
    const platform = req.params.platform;

    if (!platform) {
        return res.send(errResponse(baseResponse.SERVER_ERROR_DEVICE));
    }
    const Response = await commonProvider.chkServer();

    var Ans = {};
    Ans.isAccessable = Response.isAccessable;
    if (platform === 'aos') {
        Ans.version = Response.aosVersion;
    }
    else {
        Ans.version = Response.iosVersion;
    }

    logger.info(logmessage('앱버전, 서버점검','/app/:platform',platform));
    return res.send(response(baseResponse.SUCCESS, Ans));
}

exports.firebase = async function (req, res) {
    const memberID = req.verifiedToken.memberID;
    const { token, isAos } = req.body;
    if (!token)
        return res.send(errResponse(baseResponse.SERVER_FIREBASETOKEN_EMPTY));

    if (!isAos)
        return res.send(errResponse(baseResponse.SIGNUP_PLATFORM_NONE));

    if (isAos != 'N' && isAos != 'Y')
        return res.send(errResponse(baseResponse.SIGNUP_PLATFORM_WRONG));

    const chkID = await commonProvider.IDCheck(memberID);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const Response = commonService.insertToken(memberID, token);

    logger.info(logmessage('firebase 디바이스 토큰 저장','POST /firebase user',memberID));
    return res.send(response(baseResponse.SUCCESS));

};
