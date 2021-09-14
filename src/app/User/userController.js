const jwtMiddleware = require("../../../config/jwtMiddleware");
const userProvider = require("../../app/User/userProvider");
const userService = require("../../app/User/userService");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const regexEmail = require("regex-email");
const { emit } = require("nodemon");
const FCMadmin = require("../../../config/FCM");

var Regex = require('regex');
var regexPhone = new RegExp("^[0-9]{10,11}");
var regexAccount = new RegExp("^[0-9]{10,14}");
var regexCode = new RegExp("^([0-9]|[a-z]){8}");

exports.check = async function (req, res) {
    const idx = req.verifiedToken.memberID;

    const chkID = await userProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    logger.info(logmessage('자동로그인 완료','/auto-login user',idx));
    return res.send(response(baseResponse.TOKEN_VERIFICATION_SUCCESS));
};

exports.teamCodeUser = async function (req, res) {
    const { code } = req.body;

    if (!code)
        return res.send(errResponse(baseResponse.SIGNUP_CODE_EMPTY));

    // if (!regexCode.test(code))
    //     return res.send(errResponse(baseResponse.SIGNUP_CODE_WRONG));

    const Rows = await userProvider.codeCheck(code);

    if (!Rows) {
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));
    }

    const result = await userService.updateMemberCode(code, Rows.idx, Rows.companyIdx);

    logger.info(logmessage('팀코드 매칭 성공','POST /code user',Rows.idx));
    return res.send(result);
};

exports.companyOut = async function (req, res) {
    const idx = req.verifiedToken.memberID;

    const chkID = await userProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    const memberOut = await userService.memberCodeOut(idx);

    logger.info(logmessage('퇴사 신청 성공','POST /out user',idx));
    return res.send(memberOut);
};

exports.myPage = async function (req, res) {
    const idx = req.verifiedToken.memberID;

    const chkID = await userProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    const [result] = await userProvider.memberMypage(idx);

    logger.info(logmessage('마이페이지 조회','/mypage user',idx));
    return res.send(response(baseResponse.SUCCESS, result));
};

exports.updateInfo = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const { nickname, imgUrl, phoneNumber, bankAccount, email } = req.body;

    const chkID = await userProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    if (email && !regexEmail.test(email))
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    if (phoneNumber && !regexPhone.test(phoneNumber))
        return res.send(errResponse(baseResponse.SIGNUP_PHONE_ERROR_TYPE));

    if (bankAccount && !regexAccount.test(bankAccount))
        return res.send(errResponse(baseResponse.SIGNUP_ADMINPHONE_ERROR_TYPE));

    const params = [nickname, imgUrl, phoneNumber, bankAccount, email, idx];
    for (let i = 0; i < params.length; i++) {
        if (!params[i]) {
            params[i] = null;
        }
    }
    console.log(params);

    const result = await userService.updateMypage(params);

    logger.info(logmessage('유저 정보 수정','PATCH /profile user',idx));
    return res.send(result);
};
