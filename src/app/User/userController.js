const jwtMiddleware = require("../../../config/jwtMiddleware");
const userProvider = require("../../app/User/userProvider");
const userService = require("../../app/User/userService");
const baseResponse = require("../../../config/baseResponseStatus");
const {response, errResponse} = require("../../../config/response");
const {logger} = require("../../../config/winston");
const regexEmail = require("regex-email");
const {emit} = require("nodemon");
const admin = require('firebase-admin');
const request = require('request');
const NAVER_KEY = require("../../../config/NAVER_SENS_CREDENTIAL.json");

const CryptoJS = require("crypto-js");
const SHA256 = require("crypto-js/sha256");
const Base64 = require("crypto-js/enc-base64");

var Regex = require('regex');
var regexPhone = new RegExp("^[0-9]{10,11}");
var regexURL = new RegExp("[-a-zA-Z0-9@:%._+~#=]{1,1000}.(png|jpg)");
var regexAccount = new RegExp("^[0-9]{10,14}");
var regexLink = new RegExp("^(?:([A-Za-z]+):)?(\\/{0,3})([0-9.\\-A-Za-z]+)(?::(\\d+))?(?:\\/([^?#]*))?(?:\\?([^#]*))?(?:#(.*))?");

exports.postSMS = async function (req, res) {
    const {user_phone_number} = req.body;
    const status = req.params.status;
    var user_auth_number = Math.random().toString(36).slice(2);
    var resultCode = 404;
    var message = '';
    var ID = '';

    if (!user_phone_number)
        return res.send(errResponse(baseResponse.SIGNUP_ADMINPHONE_EMPTY));

    if (status === 1){   // 관리자 변경 및 비밀번호 수정 전 검증
        const chkPhoneResponse = await userProvider.selectAdminPhone(user_phone_number);
        if (!chkPhoneResponse){ㄹ
            return res.send(errResponse(baseResponse.SIGNUP_ID_NONE));
        }
        ID = chkPhoneResponse.adminID;
    }

    const date = Date.now().toString();
    const uri = NAVER_KEY.uri;
    const secret_key = NAVER_KEY.secret_key;
    const access_key = NAVER_KEY.access_key;
    const method = 'POST';
    const space = ' ';
    const newLine = '\n';
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${uri}/messages`;
    const url2 = `/sms/v2/services/${uri}/messages`;
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secret_key);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url2);
    hmac.update(newLine);
    hmac.update(date);
    hmac.update(newLine);
    hmac.update(access_key);

    const hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);
    request(
        {
            method: method,
            json: true,
            uri: url,
            headers: {
                "Contenc-type": "application/json; charset=utf-8",
                "x-ncp-iam-access-key": access_key,
                "x-ncp-apigw-timestamp": date,
                "x-ncp-apigw-signature-v2": signature,
            },
            body: {
                type: "SMS",
                countryCode: "82",
                from: NAVER_KEY.from,
                content: `인증번호 ${user_auth_number} 입니다.`,
                messages: [
                    {
                        to: `${user_phone_number}`
                    },
                ],
            },
        },
        function (err, respon, html) {
            if (err){
                return res.send(errResponse(baseResponse.SIGNUP_SERVER_ERROR));
            }
            if (html.error){
                message = html.error.message;
                return res.send(errResponse(baseResponse.SIGNUP_AUTH_ERROR));
            }
            else{
                resultCode = 200;
                message = html.statusName;
                var ans = {};
                ans.code = user_auth_number;
                if (status === 1){
                    ans.ID = ID;
                }
                return res.send(response(baseResponse.SUCCESS,ans));
            }
        }
    );

    // return res.send('sdadsa');
}

/**
 * API No. 1
 * API Name : 유저 생성 (회원가입) API
 * [POST] /admin
 * Body
 */
exports.postAdmin = async function (req, res) {
    const {adminId, adminPassword, logoImgUrl, name, number, link, sector, address,
        phoneNumber, email, adminName, adminPhoneNumber} = req.body;

    console.log(req.body);

    if (!adminId)
        return res.send(errResponse(baseResponse.SIGNUP_ID_EMPTY));

    if (!adminPassword)
        return res.send(errResponse(baseResponse.SIGNUP_PASSWORD_EMPTY));

    if (!logoImgUrl)
        return res.send(errResponse(baseResponse.SIGNUP_LOGOURL_EMPTY));

    if (!name)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYNAME_EMPTY));

    if (!number)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYNUM_EMPTY));

    if (!link)
        return res.send(errResponse(baseResponse.SIGNUP_LINK_EMPTY));

    if (!sector)
        return res.send(errResponse(baseResponse.SIGNUP_WORK_EMPTY));

    if (!address)
        return res.send(errResponse(baseResponse.SIGNUP_ADDRESS_EMPTY));

    if (!phoneNumber)
        return res.send(errResponse(baseResponse.SIGNUP_COMPANYPHONE_EMPTY));

    if (!email)
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_EMPTY));

    if (!adminName)
        return res.send(errResponse(baseResponse.SIGNUP_ADMINNAME_EMPTY))

    if (!adminPhoneNumber)
        return res.send(errResponse(baseResponse.SIGNUP_ADMINPHONE_EMPTY));

    // 형식 체크 (by 정규표현식)
    if (!regexEmail.test(email))
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    if (!regexPhone.test(phoneNumber))
        return res.send(errResponse(baseResponse.SIGNUP_PHONE_ERROR_TYPE));

    if (!regexPhone.test(adminPhoneNumber))
        return res.send(errResponse(baseResponse.SIGNUP_ADMINPHONE_ERROR_TYPE));

    if (!regexURL.test(logoImgUrl))
        return res.send(errResponse(baseResponse.SIGNUP_URL_ERROR_TYPE));

    if (!regexLink.test(link))
        return res.send(errResponse(baseResponse.SIGNUP_LINK_ERROR_TYPE));

    // 기타 등등 - 추가하기
    const signUpResponse = await userService.createUser(adminId, adminPassword, logoImgUrl, name, number, link, sector, address,
        phoneNumber, email, adminName, adminPhoneNumber);

    return res.send(signUpResponse);
};

// TODO: After 로그인 인증 방법 (JWT)
/**
 * API No. 4
 * API Name : 로그인 API
 * [POST] /app/login
 * body : userName, passsword
 */
exports.login = async function (req, res) {
    const {ID, password} = req.body;

    if (!ID)
        return res.send(errResponse(baseResponse.SIGNUP_ID_EMPTY));

    if (!password)
        return res.send(errResponse(baseResponse.SIGNUP_PASSWORD_EMPTY));

    // if (ID.length > 15)
    //     return res.send(errResponse(baseResponse.SIGNUP_NAME_LENGTH));
    //
    // if (password.length > 12 || password.length < 5)
    //     return res.send(errResponse(baseResponse.SIGNUP_PASSWORD_LENGTH));

    const signInResponse = await userService.adminLogin(ID, password);

    return res.send(signInResponse);

};

exports.password = async function (req, res) {
    const {ID, password, updatepassword} = req.body;
    console.log(req.body);

    if (!ID)
        return res.send(errResponse(baseResponse.SIGNUP_ID_EMPTY));

    if (!password)
        return res.send(errResponse(baseResponse.SIGNUP_PASSWORD_EMPTY));

    if (!updatepassword)
        return res.send(errResponse(baseResponse.SIGNUP_UPPASSWORD_EMPTY));

    const signInResponse = await userService.passwordUpdate(ID, password, updatepassword);

    return res.send(signInResponse);
};

exports.companylist = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const companyResponse = await userProvider.selectCompanyInfo(companyIdx);
    const Response = await userProvider.selectCloverlist(companyIdx);
    Response.company = companyResponse;

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.companyUpdate = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {logoImgUrl, name, number, link, sector, address,phoneNumber,
        email, adminName, adminPhoneNumber} = req.body;

    if (email && !regexEmail.test(email))
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    if (phoneNumber && !regexPhone.test(phoneNumber))
        return res.send(errResponse(baseResponse.SIGNUP_PHONE_ERROR_TYPE));

    if (adminPhoneNumber && !regexPhone.test(adminPhoneNumber))
        return res.send(errResponse(baseResponse.SIGNUP_ADMINPHONE_ERROR_TYPE));

    if (logoImgUrl && !regexURL.test(logoImgUrl))
        return res.send(errResponse(baseResponse.SIGNUP_URL_ERROR_TYPE));

    if (link && !regexLink.test(link))
        return res.send(errResponse(baseResponse.SIGNUP_LINK_ERROR_TYPE));


    const Response = await userService.updateCompanyInfo(adminID, companyIdx, logoImgUrl, name, number, link, sector, address,phoneNumber,
        email, adminName, adminPhoneNumber);

    return res.send(Response);
};

exports.companyDepartment = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    console.log(companyIdx);

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userProvider.selectDepartment(companyIdx);

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.addCompanyDepartment = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {department, position} = req.body;


    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    if (!department)
        return res.send(errResponse(baseResponse.SIGNUP_DEPARTMENT_EMPTY));

    if (!position)
        return res.send(errResponse(baseResponse.SIGNUP_POSITION_EMPTY));

    const Response = await userService.insertDepartment(companyIdx,department, position);

    return res.send(Response);
};

exports.delCompanyDepartment = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const departmentIdx = req.params.idx;
    console.log(companyIdx);

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userService.deleteDepartment(departmentIdx);

    return res.send(Response);
};

exports.CompanyMember = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userProvider.selectMemberPage(companyIdx);

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.postCompanyMember = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {nickname,department,position, gender, age, phoneNumber, address, email, bankAccount} = req.body;


    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return errResponse(baseResponse.SIGNIN_COMPANY_WRONG);

    if (!adminID)
        return errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE);

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return errResponse(baseResponse.SIGNIN_ID_WRONG);

    if (IDRows.status != 'ACTIVE')
        return errResponse(baseResponse.SIGNUP_COMPANY_WRONG);

    if (!nickname)
        return res.send(errResponse(baseResponse.SIGNUP_NICKNAME_EMPTY));

    if (!department)
        return res.send(errResponse(baseResponse.SIGNUP_DEPARTMENT_EMPTY));

    if (!position)
        return res.send(errResponse(baseResponse.SIGNUP_POSITION_EMPTY));

    if (!gender)
        return res.send(errResponse(baseResponse.SIGNUP_GENDER_EMPTY));

    if (!phoneNumber)
        return res.send(errResponse(baseResponse.SIGNUP_AGE_EMPTY));

    if (!age)
        return res.send(errResponse(baseResponse.SIGNUP_AGE_EMPTY));

    if (!phoneNumber)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBERPHONE_EMPTY));

    if (!address)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBERADDRESS_EMPTY));

    if (!email)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBEREMAIL_EMPTY));

    if (!bankAccount)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBERACCOUNT_EMPTY));

    // 형식 체크 (by 정규표현식)
    if (!regexEmail.test(email))
        return res.send(errResponse(baseResponse.SIGNUP_EMAIL_ERROR_TYPE));

    if (!regexPhone.test(phoneNumber))
        return res.send(errResponse(baseResponse.SIGNUP_PHONE_ERROR_TYPE))

    if (!regexAccount.test(bankAccount))
        return res.send(errResponse(baseResponse.SIGNUP_ACCOUNT_ERROR_TYPE));

    const result = await userService.insertMember(companyIdx, nickname,department,position, gender, age,
        phoneNumber, address, email, bankAccount);

    return res.send(result);
};

exports.editAdmin = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {adminName,adminPhoneNumber} = req.body;

    console.log(adminName);
    console.log(adminPhoneNumber);

    if (!adminName)
        return res.send(errResponse(baseResponse.SIGNUP_ADMINNAME_EMPTY));

    if (!adminPhoneNumber)
        return res.send(errResponse(baseResponse.SIGNUP_ADMINPHONE_EMPTY));

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);
    console.log(IDRows);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userService.updateAdminInfo(adminID,adminName,adminPhoneNumber);

    return res.send(response(baseResponse.SUCCESS));
};

exports.CompanyMemberByid = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const memberID = req.params.idx;
    console.log(companyIdx);
    console.log(memberID);

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const memberIDchk = await userProvider.memberIDCheck(companyIdx,memberID);

    console.log(memberIDchk);

    if (!memberIDchk)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBER_WRONG));

    if (!(memberIDchk.status == 'W' || memberIDchk.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_MEMBER_OUT));

    const Response = await userProvider.selectMemberById(memberID);

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.CompanyMemberUpdate = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const memberID = req.params.idx;
    const {department, position} = req.body;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    if (!department)
        return res.send(errResponse(baseResponse.SIGNUP_DEPARTMENT_EMPTY));

    if (!position)
        return res.send(errResponse(baseResponse.SIGNUP_POSITION_EMPTY));

    const memberIDchk = await userProvider.memberIDCheck(companyIdx,memberID);


    if (!memberIDchk)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBER_WRONG));

    if (!(memberIDchk.status == 'W' || memberIDchk.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_MEMBER_OUT));

    const Response = await userService.updateCompanyDepartment(memberID, companyIdx, department, position);

    return res.send(Response);
};

exports.CompanyMemberDel = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const memberID = req.params.idx;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));


    const memberIDchk = await userProvider.memberIDCheck(companyIdx,memberID);
    console.log(memberIDchk);

    if (!memberIDchk)
        return res.send(errResponse(baseResponse.SIGNUP_MEMBER_WRONG));

    if (!(memberIDchk.status == 'W' || memberIDchk.status == 'L'))
        return res.send(errResponse(baseResponse.SIGNUP_MEMBER_OUT));

    const Response = await userService.deleteCompanyMember(memberID);

    return res.send(Response);
};

exports.getGift = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userProvider.selectGifInfo(companyIdx);

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.postGift = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {imgUrl, name, info, rule} = req.body;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    if (!imgUrl)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTIMG_EMPTY));

    if (!name)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTNAME_EMPTY));

    if (!info)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTINFO_EMPTY));

    if (!rule)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTRULE_EMPTY));

    if (!regexURL.test(imgUrl))
        return res.send(errResponse(baseResponse.SIGNUP_URL_ERROR_TYPE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userService.insertGifInfo(companyIdx,imgUrl, name, info, rule);

    return res.send(Response);
};

exports.IDbyGift = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const giftID = req.params.idx;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userProvider.selectGifInfonyID(giftID);

    if (!Response)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTID_NONE));

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.giftLogLists = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userProvider.selectGiftLogList(companyIdx);

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.giftLogbyId = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const giftLogID = req.params.idx;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Response = await userProvider.selectGiftLogById(giftLogID);

    if (!Response)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOG_NONE));

    return res.send(response(baseResponse.SUCCESS,Response));
};

exports.updateGiftLog = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {giftLogID, permissionCode} = req.body;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    if (!giftLogID)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOGIDX_EMPTY));

    if (!permissionCode)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOGCODE_EMPTY));

    if (!(permissionCode == 'N' || permissionCode == 'Y'))
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOGCODE_TYPE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const Logchk = await userProvider.selectGiftLogchk(giftLogID);

    if (!Logchk)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOG_NONE));

    if (Logchk.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOG_NONE));

    if (Logchk.isAccepted)
        return res.send(errResponse(baseResponse.SIGNUP_GIFTLOG_STATUS));

    const result = await userService.updateGiftLogAdmit(giftLogID,permissionCode)

    return res.send(result);
};

exports.updateGift = async function (req, res) {
    const adminID = req.verifiedToken.adminID;
    const companyIdx = req.verifiedToken.companyIdx;
    const {imgUrl, explain, rule, option} = req.body;

    const Rows = await userProvider.companyCheck(companyIdx);

    if (!Rows)
        return res.send(errResponse(baseResponse.SIGNIN_COMPANY_WRONG));

    if (!adminID)
        return res.send(errResponse(baseResponse.TOKEN_VERIFICATION_FAILURE));

    const IDRows = await userProvider.IDCheck(adminID);

    if (!IDRows)
        return res.send(errResponse(baseResponse.SIGNIN_ID_WRONG));

    if (IDRows.status != 'ACTIVE')
        return res.send(errResponse(baseResponse.SIGNUP_COMPANY_WRONG));

    const result = await userService.updateGiftInfo()

    return res.send(result);
};

/** JWT 토큰 검증 API
 * [GET] /app/auto-login
 */
exports.check = async function (req, res) {
    const userIDResult = req.verifiedToken.userID;
    console.log(userIDResult);
    return res.send(response(baseResponse.TOKEN_VERIFICATION_SUCCESS));
};