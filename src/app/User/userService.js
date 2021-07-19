const {logger} = require("../../../config/winston");
const {pool} = require("../../../config/database");
const secret_config = require("../../../config/secret");
const userProvider = require("./userProvider");
const userDao = require("./userDao");
const baseResponse = require("../../../config/baseResponseStatus");
const {response} = require("../../../config/response");
const {errResponse} = require("../../../config/response");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {connect} = require("http2");

// Service: Create, Update, Delete 비즈니스 로직 처리

exports.createUser = async function (ID, password, logoImgUrl, name, number, link, sector, address,
                                     phoneNumber, email, adminName, adminPhoneNumber) {
    try {
        const IDRows = await userProvider.IDCheck(ID);

        if (IDRows)
            return errResponse(baseResponse.SIGNUP_NAME_FAIL);

        const nameRows = await userProvider.nameCheck(name);

        if (nameRows)
            return errResponse(baseResponse.SIGNUP_NAME_ALREADY);

        const Rows = await userProvider.emailCheck(email);

        if (Rows)
            return errResponse(baseResponse.SIGNUP_EMAIL_FAIL);

        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const insertUserInfoParams = [ID, hashedPassword, logoImgUrl, name, number, link, sector, address,
            phoneNumber, email, adminName, adminPhoneNumber];

        const connection = await pool.getConnection(async (conn) => conn);
        const [userIdResult] = await userDao.insertUserInfo(connection, insertUserInfoParams);

        connection.release();
        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - createUser Service error\n: ${err.message}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.passwordUpdate = async function (ID, password, updatepassword) {
    try {
        const IDRows = await userProvider.IDCheck(ID);

        if (!IDRows)
            return errResponse(baseResponse.SIGNIN_ID_WRONG);

        if (IDRows.status != 'ACTIVE')
            return errResponse(baseResponse.SIGNUP_COMPANY_WRONG);

        // 비밀번호 확인
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const selectUserPasswordParams = [ID, hashedPassword];
        const [passwordRows] = await userProvider.passwordCheck(selectUserPasswordParams);
        if (!passwordRows) {
            return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
        }

        const hashednewPassword = await crypto
            .createHash("sha512")
            .update(updatepassword)
            .digest("hex");

        const params = [hashednewPassword, ID];
        console.log(typeof params)
        console.log(params);

        const connection = await pool.getConnection(async (conn) => conn);
        const [Result] = await userDao.updateAdminpassword(connection, params);

        connection.release();
        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.adminLogin = async function (ID, password) {
    try {
        const IDRows = await userProvider.IDCheck(ID);

        if (!IDRows)
            return errResponse(baseResponse.SIGNIN_ID_WRONG);

        if (IDRows.status != 'ACTIVE')
            return errResponse(baseResponse.SIGNUP_COMPANY_WRONG);

        // 비밀번호 확인
        const hashedPassword = await crypto
            .createHash("sha512")
            .update(password)
            .digest("hex");

        const selectUserPasswordParams = [ID, hashedPassword];
        const [passwordRows] = await userProvider.passwordCheck(selectUserPasswordParams);
        if (!passwordRows) {
            return errResponse(baseResponse.SIGNIN_PASSWORD_WRONG);
        }
        //토큰 생성 Service
        let token = await jwt.sign(
            {
                adminID: ID,
                companyIdx: passwordRows.idx,
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀키
            {
                expiresIn: "365d",
                subject: "Company",
            } // 유효 기간 365일
        );
        return response(baseResponse.SUCCESS, {'jwt':token});
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.updateCompanyInfo = async function (adminID, companyIdx, logoImgUrl, name, number, link, sector, address,phoneNumber,
                                            email, adminName, adminPhoneNumber) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const IDRows = await userDao.selectUserID(connection,adminID);

        if (!IDRows)
            return errResponse(baseResponse.SIGNIN_ID_WRONG);

        if (IDRows.status != 'ACTIVE')
            return errResponse(baseResponse.SIGNUP_COMPANY_WRONG);

        var params = [logoImgUrl, name, number, link, sector, address,phoneNumber,
            email, adminName, adminPhoneNumber, adminID];

        for (let i in params){
            if (!params[i]){
                params[i] = null;
            }
        }

        const resrow = await userDao.updateCompanyInfo(connection,params);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.insertDepartment = async function (companyIdx,department, position) {
    try {
        const departmentChk = await userProvider.selectDepartmentUsing(companyIdx,department, position);

        if (departmentChk)
            return errResponse(baseResponse.SIGNUP_DEPARTMENT_ALREADY);

        const params = [companyIdx, department, position];
        const connection = await pool.getConnection(async (conn) => conn);
        const Result = await userDao.insertCompanyInfo(connection, params);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.deleteDepartment = async function (departmentIdx) {
    try {
        const departmentChk = await userProvider.selectDepartmentChk(departmentIdx);

        if (!departmentChk)
            return errResponse(baseResponse.SIGNUP_POSITION_NONE);

        const memberDepartchk = await userProvider.selectAllposition(departmentIdx);

        if (memberDepartchk.length != 0)
            return errResponse(baseResponse.SIGNUP_POSITION_USE);

        const connection = await pool.getConnection(async (conn) => conn);
        const Result = await userDao.deleteCompanyInfo(connection, departmentIdx);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.insertMember = async function (companyIdx, nickname, department,position, gender, age,
                                       phoneNumber, address, email, bankAccount) {
    try {
        const nicknameChk = await userProvider.selectNicknameChk(companyIdx,nickname);
        var code = Math.random().toString(36).slice(2,10);
        var chk = await userProvider.codeChk(code);

        while(chk.length != 0) {
            code = Math.random().toString(36).slice(0, 8);
            chk = await userProvider.codeChk(code);
        }

        if (nicknameChk)
            return errResponse(baseResponse.SIGNUP_NICKNAME_USE);

        const memberDepartchk = await userProvider.selectIdxDepart(companyIdx,department,position);

        if (!memberDepartchk)
            return errResponse(baseResponse.SIGNUP_DEPARTMENT_NONE);

        console.log(memberDepartchk);

        const params = [nickname, memberDepartchk.idx, gender, age,
            phoneNumber, address, email, bankAccount, companyIdx,code];

        const connection = await pool.getConnection(async (conn) => conn);
        const Result = await userDao.insertMemberApply(connection, params);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.updateAdminInfo = async function (adminID,adminName,adminPhoneNumber) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const params = [adminName,adminPhoneNumber,adminID];
        const Result = await userDao.updatedAdminInfo(connection, params);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.updateCompanyDepartment = async function (memberID, companyIdx, department, position) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const params = [companyIdx,department, position];
        console.log(params);
        const [chk] = await userDao.selectCompanyDepartmentUse(connection,params);
        console.log(chk);
        if (!chk)
            return errResponse(baseResponse.SIGNUP_DEPARTMENT_NONE);

        const pa = [chk.idx,memberID]

        const Result = await userDao.updateMemberDepart(connection, pa);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.deleteCompanyMember = async function (memberID) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        const Result = await userDao.deleteMemberOut(connection, memberID);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.insertGifInfo = async function (companyIdx,imgUrl, name, info, rule) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const pa = [companyIdx,name];
        const [chk] = await userDao.GiftnameChk(connection,pa);

        if (chk)
            return errResponse(baseResponse.SIGNUP_GIFTRULE_ALREADY);

        const params = [companyIdx,imgUrl, name, info, rule]


        const Result = await userDao.insertGift(connection, params);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.updateGiftLogAdmit = async function (giftLogID,permissionCode) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const pa = [permissionCode,giftLogID];
        const [Row] = await userDao.GiftLogChk(connection,giftLogID);
        console.log(Row);
        const Result = await userDao.updateAdmitGiftLog(connection, pa);

        if (permissionCode === 'Y'){
            const [RO] = await userDao.selectMemberByID(connection,Row.memberIdx);
            console.log(RO);
            if (!RO){
                return errResponse(baseResponse.SIGNUP_MEMBER_NONE);
            }

            const params = [RO.currentClover - Row.usedClover,Row.memberIdx];
            const Res = await userDao.updateMemberPoint(connection, params);
            const insert = await userDao.insertClover(connection,giftLogID);
        }

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.updateGiftInfo = async function (giftID,imgUrl, info, rule, deletedOptions, addedOptions) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        const [chk] = await userDao.chkGift(connection,giftID);

        if (!chk)
            return errResponse(baseResponse.SIGNUP_GIFTID_NONE);

        const params = [imgUrl, info, rule,giftID];
        const Update = await userDao.updateGiftByid(connection,params);

        for (let i = 0; i < deletedOptions.length; i++){    // 옵션 삭제
            const del = await userDao.delGiftbyID(connection,deletedOptions[i]);
        }

        for (let i = 0; i < addedOptions.length; i++){
            const params = [giftID,addedOptions[i].clover, addedOptions[i].money]
            const up = await userDao.addGiftOptionbyID(connection,params);
        }

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}

exports.deleteGiftInfo = async function (giftID) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const [chk] = await userDao.chkGift(connection,giftID);
        console.log(chk);

        if (!chk)
            return errResponse(baseResponse.SIGNUP_GIFTID_NONE);

        const Update = await userDao.deleteGiftByid(connection,giftID);

        connection.release();

        return response(baseResponse.SUCCESS);
    } catch (err) {
        logger.error(`App - postSignIn Service error\n: ${err.message} \n${JSON.stringify(err)}`);
        return errResponse(baseResponse.DB_ERROR);
    }
}