const jwtMiddleware = require("../../../config/jwtMiddleware");
const workProvider = require("../../app/Work/workProvider");
const workService = require("../../app/Work/workService");
const baseResponse = require("../../../config/baseResponseStatus");
const { response, errResponse } = require("../../../config/response");
const { logger, logmessage } = require("../../../config/winston");
const { emit } = require("nodemon");
const FCMadmin = require("../../../config/FCM");

exports.workon = async function (req, res) {
    const idx = req.verifiedToken.memberID;
    const companyIdx = req.verifiedToken.companyIdx;

    const chkID = await workProvider.IDCheck(idx);

    if (!chkID)
        return res.send(errResponse(baseResponse.SIGNUP_NAME_NONE));

    if (!(chkID.status == 'W' || chkID.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYMEMBER_OUT));

    if (!chkID.companyStatus)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_EXIT));

    if (chkID.companyStatus != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_NONE));

    console.log(chkID);
    const result = await workService.memberWorkon(idx, companyIdx, chkID.status
        , chkID.currentClover, chkID.accumulatedClover);

    const today = new Date();

    if (chkID.status == 'L'){
        logger.info(logmessage(`출근 완료 ${chkID.status} -> W `, 'POST /work user', idx));
        FCMadmin.fcm(chkID.firebaseToken,"오늘도 출근성공✨",`${chkID.name}에 ${today.getHours()}:${today.getMinutes()} 출근했습니다! 샐리가 응원할게요:)`);
    }
    else{
        logger.info(logmessage(`퇴근 완료 ${chkID.status} -> L `, 'POST /work user', idx));
        FCMadmin.fcm(chkID.firebaseToken,"오늘도 퇴근성공🍺",`${chkID.name}에 ${today.getHours()}:${today.getMinutes()} 퇴근했습니다! 오늘 하루도 고생하셨어요:)`);
    }

    return res.send(result);
};

exports.patchWorkOff = async function (req, res) {
    const result = await workService.dailyWorkOff();

    if (result.isSuccess) {
        const today = new Date();
        logger.info(logmessage(`자동 퇴근 완료 ${today} `, 'GET /auto-workoff user'));
        for (let i = 0; i < result.result.length; i++){
            FCMadmin.fcm(result.result[i].firebaseToken,'오늘도 퇴근성공🍺',`${result.result[i].name}에 00:00 퇴근했습니다! 오늘 하루도 고생하셨어요:)`)
        }
    }
    delete result.result;
    return res.send(result);
};
