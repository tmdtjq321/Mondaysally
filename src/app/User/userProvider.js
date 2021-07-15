const { pool } = require("../../../config/database");
const { logger } = require("../../../config/winston");

const userDao = require("./userDao");

exports.IDCheck = async function (ID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [Result] = await userDao.selectUserID(connection, ID);
    connection.release();

    return Result;
};

exports.emailCheck = async function (email) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [Result] = await userDao.selectUserEmail(connection, email);
    connection.release();

    return Result;
};

exports.selectAdminPhone = async function (user_phone_number) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [Result] = await userDao.selectAdminPhonnumber(connection, user_phone_number);
    connection.release();

    return Result;
};

exports.passwordCheck = async function (selectUserPasswordParams) {
    const connection = await pool.getConnection(async (conn) => conn);
    const passwordCheckResult = await userDao.selectUserPassword(connection, selectUserPasswordParams);
    connection.release();
    return passwordCheckResult;
};

exports.companyCheck = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [CheckResult] = await userDao.selectCompany(connection, companyIdx);
    connection.release();
    return CheckResult;
};


exports.selectCloverlist = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    var obj = {};
    var Result = await userDao.selectCompanyList(connection,companyIdx);
    var monthResult = await userDao.selectMonthCompanyList(connection,companyIdx);
    var monthGift  = await userDao.selectMonthGift(connection);
    var giftRequest = await userDao.selectGiftrequest(connection,companyIdx);
    connection.release();
    var sum = 0;
    for (var i = 0; i < Result.length-1; i++){
        sum += (Result[i].point / Result[i].usedClover) * Result[i].money;
    }
    Result[Result.length-1].sum = sum;
    obj.totalResult = Result[Result.length-1];
    obj.monthResult = monthResult;
    obj.monthGifts = monthGift;
    obj.giftRequests = giftRequest;
    return obj;
};

exports.selectAllposition = async function (departmentIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectAllpositionchk(connection,departmentIdx);
    connection.release();

    return result;
};

exports.selectCompanyInfo = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [result] = await userDao.selectCompanyInfo(connection,companyIdx);
    connection.release();

    return result;
};


exports.selectDepartmentChk = async function (departmentIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [result] = await userDao.selectDepartment(connection,departmentIdx);
    console.log(result);
    connection.release();

    return result;
};

exports.selectMemberPage = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectMemberByPage(connection,companyIdx);
    connection.release();

    return result;
};

exports.selectDepartment = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectCompanyDepartment(connection,companyIdx);
    console.log(result);
    var obj = {};

    for (let i in result){
        if (!obj[result[i].department]){
            obj[result[i].department] = [];
        }
        obj[result[i].department].push(result[i].position);
    }


    connection.release();

    return obj
};

exports.selectDepartmentUsing = async function (companyIdx,department, position) {
    const connection = await pool.getConnection(async (conn) => conn);
    const params = [companyIdx,department, position];
    const [result] = await userDao.selectCompanyDepartmentUse(connection,params);

    connection.release();

    return result;
};

exports.selectNicknameChk = async function (companyIdx,nickname) {
    const connection = await pool.getConnection(async (conn) => conn);
    const p = [companyIdx,nickname]
    const [result] = await userDao.selectMemberNick(connection,p);

    connection.release();

    return result;
};

exports.selectIdxDepart = async function (companyIdx,department,position) {
    const connection = await pool.getConnection(async (conn) => conn);
    const p = [companyIdx,department,position]
    const [result] = await userDao.selectDepartId(connection,p);

    connection.release();

    return result;
};

exports.codeChk = async function (code) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectCodechk(connection,code);

    connection.release();

    return result;
};

exports.nameCheck = async function (name) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [result] = await userDao.selectCompanyNamechk(connection,name);

    connection.release();

    return result;
};

exports.selectMemberById = async function (memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [result] = await userDao.selectMemberByIdx(connection,memberID);

    connection.release();

    return result;
};

exports.memberIDCheck = async function (companyIdx,memberID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const p = [memberID,companyIdx];
    const [result] = await userDao.selectMember(connection,p);

    connection.release();

    return result;
};

exports.selectGifInfo = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectGiftlist(connection,companyIdx);
    console.log(result);

    connection.release();

    return result;
};

exports.selectGifInfonyID = async function (giftID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectGiftbyID(connection,giftID);
    console.log(result);
    var obj = {};
    if (result.length == 0){
        return null;
    }

    obj.thumnail = result[0].imgUrl;
    obj.name = result[0].name;
    obj.info = result[0].info;
    obj.rule = result[0].rule;
    obj.option = [];
    for (let i in result){
        if (result[i].usedClover && result[i].money){
            obj.option.push({'usedClover' : result[i].usedClover,'money' : result[i].money});
        }
    }

    connection.release();

    return obj;
};

exports.selectGiftLogList = async function (companyIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectGiftLoglist(connection,companyIdx);

    connection.release();

    return result;
};

exports.selectGiftLogById = async function (giftLogID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const result = await userDao.selectGiftLogID(connection,giftLogID);
    connection.release();

    return result;
};

exports.selectGiftLogchk = async function (giftLogID) {
    const connection = await pool.getConnection(async (conn) => conn);
    const [result] = await userDao.GiftLogChk(connection,giftLogID);
    connection.release();

    return result;
};