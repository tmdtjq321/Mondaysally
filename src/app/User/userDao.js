var pages = function p(Row){
    var tmp = new Array();
    var idx = 0;
    var obj = {};
    for (let i = 0; i < Row.length; i++){
        if (i != 0 && (i % 30 == 0)){
            idx = i / 30;
            obj[idx] = tmp;
            tmp = [];
        }
        tmp.push(Row[i]);
    }
    if (tmp.length != 0){
        idx++;
        obj[idx] = tmp;
    }

    return obj;
}

// 모든 유저 조회
async function selectUser(connection) {
    const selectUserListQuery = `
                SELECT ID 
                FROM Company;
                `;
    const [userRows] = await connection.query(selectUserListQuery);
    return userRows;
};

async function selectUserID(connection, ID) {
    const Query = `
                SELECT *
                FROM Company where adminId = ? and status = 'ACTIVE';
                `;
    const [userRows] = await connection.query(Query,ID);
    return userRows;
};

async function selectUserEmail(connection, email) {
    const Query = `
                SELECT name 
                FROM Company where email = ?;
                `;
    const [userRows] = await connection.query(Query,email);
    return userRows;
};

async function selectAdminPhonnumber(connection, Phone) {
    const Query = `
                SELECT ID, email 
                FROM Company where adminPhone = ?;
                `;
    const [userRows] = await connection.query(Query,Phone);
    return userRows;
};


async function selectCompany(connection, companyIdx){
    const Query = `
        select * from Company where idx = ?;
    `;
    const [resultRow] = await connection.query(Query,companyIdx);
    return resultRow;
}

// 유저 생성
async function insertUserInfo(connection, insertUserInfoParams) {
    const insertUserInfoQuery = `
        INSERT INTO Company(adminId, adminPassword, logoImgUrl, name, number, link, sector, address,
                            phoneNumber, email, adminName, adminPhoneNumber)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const insertUserInfoRow = await connection.query(insertUserInfoQuery, insertUserInfoParams);

    return insertUserInfoRow;
};

async function selectUserPassword(connection, selectUserPasswordParams) {
    const selectUserPasswordQuery = `
        SELECT adminName, email, idx, name
        FROM Company WHERE adminId = ? AND adminPassword = ?;`;
    const [selectUserPasswordRow] = await connection.query(selectUserPasswordQuery, selectUserPasswordParams);

    return selectUserPasswordRow;
};

async function updateAdminpassword(connection, params) {
    const Query = `
        UPDATE Company SET adminPassword = ? WHERE adminId = ?;`;
    const rQuery = `select * from Company order by updatedAt desc limit 1;`;

    const Row = await connection.query(Query, params);
    const [resRow] = await connection.query(rQuery);

    return resRow;
};

async function selectCompanyList(connection, companyIdx) {
    const Query = `
        select sum(Clover.point) as calPoint, A.usePoint
        from Clover join (select companyIdx, sum(point) as usePoint
                          from Clover where workIdx is null group by companyIdx
                          having companyIdx = ?) as A
                         on A.companyIdx = Clover.companyIdx
        where workIdx is not null;
    `;
    const moneyQuery = `select Clover.giftIdx, Clover.optionIdx, Clover.point, 
            GiftOption.usedClover, GiftOption.money from Clover
            join GiftOption on GiftOption.idx = Clover.optionIdx
            where Clover.companyIdx = ?;`
    const [resultRow] = await connection.query(Query, companyIdx);
    resultRow[0].calPoint = parseInt(resultRow[0].calPoint);
    resultRow[0].usePoint = parseInt(resultRow[0].usePoint);
    resultRow[0].nowPoint = resultRow[0].calPoint - resultRow[0].usePoint;
    const [Row] = await connection.query(moneyQuery, companyIdx);
    Row.push(resultRow[0]);

    return Row;
}

async function selectMonthCompanyList(connection, companyIdx) {
    const Query = `
        select date_format(Clover.createdAt, '%Y-%m') as date, sum(point) as calPoint
        from Clover WHERE workIdx is not null and companyIdx = ? and
            date_format(Clover.createdAt, '%Y-%m') like concat ('%', year (now()), '%') group by date;

    `;
    const moneyQuery = `
        select date_format(Clover.createdAt, '%Y-%m') as date, sum(point) as calPoint
        from Clover WHERE workIdx is null and companyIdx = ? and
            date_format(Clover.createdAt, '%Y-%m') like concat ('%', year (now()), '%') group by date;
        `;

    const monthQuery = `select Clover.point,GiftOption.usedClover,GiftOption.money,
     date_format(Clover.createdAt,'%Y-%m') as A from Clover
    join GiftOption on GiftOption.idx = Clover.optionIdx 
    where workIdx is null and 
    date_format(Clover.createdAt,'%Y-%m') like concat ('%', year (now()), '%') 
    order by Clover.createdAt;`;

    var [resultRow] = await connection.query(Query, companyIdx);
    var [Row] = await connection.query(moneyQuery, companyIdx);
    var [monthRow] = await connection.query(monthQuery);
    var obj = {};
    console.log(monthRow);
    for (let i in monthRow){
        obj[monthRow[i].A] = 0;
    }
    for (let i in monthRow){
        obj[monthRow[i].A] += (monthRow[i].point / monthRow[i].usedClover) * monthRow[i].money;
    }
    console.log(obj);
    for (let key in obj){
        for (let i in Row){
            if (Row[i].date == key){
                Row[i].money = obj[key];
                delete obj[key];
                break;
            }
        }
    }

    return Row;
}

async function selectCompanyInfo(connection, companyIdx) {
    const Query = `
        select logoImgUrl, name, number, link, sector, address, 
        phoneNumber, email, adminName,adminPhoneNumber from Company
        where idx = ? and status = 'ACTIVE';
    `;
    const [Row] = await connection.query(Query, companyIdx);

    return Row;
}

async function selectMonthGift(connection) {
    const Query = `
        select date_format(GiftLog.createdAt, '%Y-%m') as date, 
        count(GiftLog.idx) as cnt from GiftLog
        where date_format(GiftLog.createdAt, '%Y-%m')
            like concat ('%' , year(now()), '%') group by date;
    `;
    const [Row] = await connection.query(Query);

    return Row;
}

async function selectGiftrequest(connection,companyIdx) {
    const Query = `
        select Gift.name, Gift.imgUrl, Gift.info,Gift.rule, count(GiftLog.idx) as giftRequest
        from GiftLog join Gift on Gift.idx = GiftLog.giftIdx
        where GiftLog.createdAt <= now() and companyIdx = ? group by giftIdx;
    `;
    const [Row] = await connection.query(Query,companyIdx);

    return Row;
}

async function updateCompanyInfo(connection,params) {
    const Query = `
        UPDATE Company SET logoImgUrl = ?, name = ?, number = ?, link = ?, sector = ?, address = ?,
                           phoneNumber = ?, email = ?, adminName = ?, adminPhoneNumber = ?
        WHERE adminId = ?;
    `;
    const Row = await connection.query(Query,params);

    return Row;
}

async function selectDepartment(connection,idx) {
    const Query = `
        select * from CompanyDepartment where idx = ? and status = 'ACTIVE';
    `;
    const [Row] = await connection.query(Query,idx);

    return Row;
}


async function selectCompanyDepartment(connection,companyIdx) {
    const Query = `
        select department, position from CompanyDepartment where companyIdx = ? and status = 'ACTIVE' 
        order by department;
    `;
    const [Row] = await connection.query(Query,companyIdx);

    return Row;
}

async function insertCompanyInfo(connection,params) {
    const Query = `
        insert into CompanyDepartment(companyIdx, department, position)
        values (?,?,?);
    `;
    const Row = await connection.query(Query,params);

    return Row;
}

async function deleteCompanyInfo(connection,departmentIdx) {
    const Query = `
        update CompanyDepartment set status = 'INACTIVE' where idx = ?;
    `;
    const Row = await connection.query(Query,departmentIdx);

    return Row;
}

async function selectAllpositionchk(connection,departmentIdx){
    const Query = `
        select * from Member where
            companyDepartmentIdx = ? and status = 'W';
    `;
    const [Row] = await connection.query(Query,departmentIdx);

    return Row;
}

async function deleteCompanyDepartment(connection,companyIdx,department){
    const Query = `
        update CompanyDepartment set status = 'INACTIVE' where companyIdx = ? and department = ?;
    `;
    const Row = await connection.query(Query,companyIdx,department);

    return Row;
}

async function selectCompanyDepartmentUse(connection,params){
    const Query = `
        select * from CompanyDepartment where status = 'ACTIVE' and companyIdx = ? and department = ?
        and position = ?;
    `;
    const [Row] = await connection.query(Query,params);

    return Row;
}

async function selectMemberByPage(connection,companyIdx){
     const Query = `
         select imgUrl, nickname, department, position from Member join CompanyDepartment
             on CompanyDepartment.idx = Member.companyDepartmentIdx
         where (Member.status = 'W' or Member.status = 'L') and Member.companyIdx = ?;
    `;

     const [Row] = await connection.query(Query,companyIdx);
     var result = pages(Row);

     return result;
}

async function selectMemberNick(connection,params){
    const Query = `
        select * from Member where companyIdx = ? and nickname = ?;
    `;
    const [Row] = await connection.query(Query,params);

    return Row;
}

async function selectMember(connection,pa){
    const Query = `
        select * from Member where idx = ? and companyIdx = ?;
    `;
    const [Row] = await connection.query(Query,pa);

    return Row;
}

async function selectDepartId(connection,params){
    const Query = `
        select * from CompanyDepartment where companyIdx = ? and 
        department = ? and position = ? and status = 'ACTIVE';
    `;
    const [Row] = await connection.query(Query,params);

    return Row;
}

async function insertMemberApply(connection,params){
    const Query = `
        insert into Member(nickname,companyDepartmentIdx,gender,age,phoneNumber,
            address, email, bankAccount, companyIdx,code) values (?,?,?,?,?,?,?,?,?,?);
    `;
    const Row = await connection.query(Query,params);

    return Row;
}

async function selectCodechk(connection,code){
    const Query = `
        select * from Member where code = ?;
    `;
    const [Row] = await connection.query(Query,code);

    return Row;
}

async function selectCompanyNamechk(connection,name){
    const Query = `
        select * from Company where name = ?;
    `;
    const [Row] = await connection.query(Query,name);

    return Row;
}

async function updatedAdminInfo(connection,params){
    const Query = `
        update Company set adminName = ?, adminPhoneNumber = ?
        where adminID = ?;
    `;
    const Row = await connection.query(Query,params);

    return Row;
}

async function selectMemberByIdx(connection,memberID){
    const Query = `
        select Member.imgUrl, CompanyDepartment.department, CompanyDepartment.position,
            year(now()) - year(Member.createdAt) as workyear, Member.code, Member.email,
            Member.phoneNumber, Member.bankAccount, Member.address
        from Member join CompanyDepartment on CompanyDepartment.idx = Member.companyDepartmentIdx
        where Member.idx = ?;
    `;
    const [Row] = await connection.query(Query,memberID);

    return Row;
}

async function updateMemberDepart(connection,params){
    const Query = `
        update Member set companyDepartmentIdx = ? where idx = ?;
    `;
    const Row = await connection.query(Query,params);

    return Row;
}

async function deleteMemberOut(connection,memberID){
    const Query = `
        update Member set status = 'R' where idx = ?;
    `;
    const Row = await connection.query(Query,memberID);

    return Row;
}

async function selectGiftlist(connection,companyIdx){
    const Query = `
        select imgUrl, name from Gift where status = 'ACTIVE' and companyIdx = ?;
    `;
    const [Row] = await connection.query(Query,companyIdx);
    var result = pages(Row);

    return result;
}

async function insertGift(connection,params){
    const Query = `insert into Gift(companyIdx,imgUrl,name,info,rule) values
        (?,?,?,?,?);`;

    const [Row] = await connection.query(Query,params);
    return Row;
}

async function GiftnameChk(connection,params){
    const Query = `select * from Gift
    where companyIdx = ? and status = 'ACTIVE' and name = ?;`;

    const [Row] = await connection.query(Query,params);
    return Row;
}

async function selectGiftbyID(connection,giftID){
    const Query = `select Gift.imgUrl,Gift.name,Gift.info,Gift.rule,Gift.createdAt,
                          GiftOption.idx,GiftOption.usedClover,GiftOption.money from Gift
                    left join GiftOption on Gift.idx = GiftOption.giftIdx and
                                            GiftOption.status = 'ACTIVE'
                   where Gift.idx = ? and Gift.status = 'ACTIVE';`;

    const [Row] = await connection.query(Query,giftID);
    return Row;
}

async function selectGiftLoglist(connection,companyIdx){
    const Query = `
        select date_format(GiftLog.createdAt,'%y-%m') as date, Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
            GiftLog.createdAt from GiftLog
            join Gift on GiftLog.giftIdx = Gift.idx
            join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE';
    `;
    const Query2 = `
        select Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
               GiftLog.createdAt
        from GiftLog
                 join Gift on GiftLog.giftIdx = Gift.idx
                 join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and GiftLog.isAccepted is null;
    `;
    const Query3 = `
        select Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
               GiftLog.createdAt
        from GiftLog
                 join Gift on GiftLog.giftIdx = Gift.idx
                 join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and GiftLog.isAccepted = 'N';
    `;
    const Query4 = `
        select Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
               GiftLog.createdAt
        from GiftLog
                 join Gift on GiftLog.giftIdx = Gift.idx
                 join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and GiftLog.isAccepted = 'Y';
    `;
    const result = {};
    var monthResult = {};
    const [Row] = await connection.query(Query,companyIdx);
    for (let i = 0; i < Row.length; i++){
        var month = Row[i].date;
        delete Row[i].date;
        if (!monthResult[month]){
            monthResult[month] = new Array();
        }
        monthResult[month].push(Row[i]);
    }
    const [Row2] = await connection.query(Query2,companyIdx);   // 승인대기
    const [Row3] = await connection.query(Query3,companyIdx);   // 승인거부
    const [Row4] = await connection.query(Query4,companyIdx);   // 승인완료
    const Rowpage = pages(Row);
    const Rowpage2 = pages(Row2);
    const Rowpage3 = pages(Row3);
    const Rowpage4 = pages(Row4);
    result.allGiftLog = Rowpage;
    result.permissionWaitGiftLog = Rowpage2;
    result.permissionRejectGiftLog = Rowpage3;
    result.permissionCompleteGiftLog = Rowpage4;

    const keys = Object.keys(monthResult)

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i] // 각각의 키
        const value = monthResult[key] // 각각의 키에 해당하는 각각의 값
        monthResult[key] = pages(value);
    }
    result.monthResult = monthResult    // 월별 기프트 신청 리스트

    return result;
}

async function selectGiftLogID(connection,giftLogID){
    const Query = `
        select Gift.imgUrl as giftImgUrl, Gift.name, Member.nickname, GiftLog.isAccepted,
               Twinkle.receiptImgUrl, TwinkleImg.imgUrl, Twinkle.createdAt, GiftOption.usedClover, GiftOption.money
        from GiftLog join Member on Member.idx = GiftLog.memberIdx
                     join Gift on GiftLog.giftIdx = Gift.idx
                     join GiftOption on GiftOption.usedClover = GiftLog.usedClover
                     left join Twinkle on Twinkle.giftLogIdx = GiftLog.idx
                     left join TwinkleImg on TwinkleImg.twinkleIdx = Twinkle.idx
        where GiftLog.idx = ? and GiftLog.status = 'ACTIVE';
    `;

    const [Row] = await connection.query(Query,giftLogID);
    console.log(Row);
    if (Row.length == 0){
        return null;
    }

    var result = {}
    result.giftImgUrl = Row[0].giftImgUrl;
    result.name = Row[0].name;
    result.nickname = Row[0].nickname;
    result.isAccepted = Row[0].isAccepted;
    result.receiptImgUrl = Row[0].receiptImgUrl;
    result.proofDate = Row[0].createdAt;
    result.usedClover = Row[0].usedClover;
    result.money = Row[0].money;

    var tmp = [];
    for (let i = 0; i < Row.length; i++){
        if (Row[i].imgUrl){
            tmp.push(Row[i].imgUrl);
        }
    }

    result.twinkleImgUrlList = tmp;
    return result;
}

async function GiftLogChk(connection,giftLogID){
    const Query = `
    select * from GiftLog where idx = ?;
    `;

    const [Row] = await connection.query(Query,giftLogID);
    return Row;
}

async function updateAdmitGiftLog(connection,params){
    const Query = `
        update GiftLog set isAccepted = ? where idx = ?;
    `;

    const [Row] = await connection.query(Query,params);
    return Row;
}

async function updateGiftByid(connection,params){
    const Query = `
        update Gift set imgUrl = ?, info = ?, rule = ? where idx = ?;
    `;

    const [Row] = await connection.query(Query,params);
    return Row;
}

async function delGiftbyID(connection,optionID){
    const Query = `
        update GiftOption set status = 'INACTIVE' where idx = ?;
    `;

    const [Row] = await connection.query(Query,optionID);
    return Row;
}

async function addGiftOptionbyID(connection,params){
    const Query = `
        insert into GiftOption(giftIdx,usedClover,money) values (?,?,?);
    `;

    const [Row] = await connection.query(Query,params);
    return Row;
}

async function chkGift(connection,giftID){
    const Query = `
        select * from Gift where idx = ?;
    `;

    const [Row] = await connection.query(Query,giftID);
    return Row;
}

async function deleteGiftByid(connection,giftID){
    const Query = `
        update Gift set status = 'INACTIVE' where idx = ?;
    `;

    const [Row] = await connection.query(Query,giftID);
    return Row;
}

async function updateMemberPoint(connection,){
    const Query = `
        update Member set currentClover = ? where idx = ?;
    `;

    const [Row] = await connection.query(Query,giftID);
    return Row;
}

async function selectCloverlists(connection,params){
    const Query = `
        select * from 
    `;

    const [Row] = await connection.query(Query,giftID);
    return Row;
}

async function selectMemberByID(connection,memberID){
    const Query = `
        select * from Member where idx = ? and status = 'ACTIVE';
    `;

    const [Row] = await connection.query(Query,memberID);
    return Row;
}

async function insertClover(connection,GiftLogID){
    const Query = `insert into Clover(memberIdx,giftIdx,optionIdx,companyIdx,point)
    select GiftLog.memberIdx, GiftLog.giftIdx ,GiftOption.idx, 
    Member.companyIdx,GiftLog.usedClover from GiftLog 
    join GiftOption on GiftOption.usedClover = GiftLog.usedClover 
    and GiftOption.giftIdx = GiftLog.giftIdx
    join Member on Member.idx = GiftLog.memberIdx
    where GiftLog.idx = ?;`;
    const [Row] = await connection.query(Query,GiftLogID);
    return Row;
}


module.exports = {
    selectUser,
    selectCompany,
    selectUserID,
    selectUserEmail,
    selectAdminPhonnumber,
    insertUserInfo,
    selectUserPassword,
    updateAdminpassword,
    selectCompanyList,
    selectMonthCompanyList,
    selectCompanyInfo,
    selectMonthGift,
    selectGiftrequest,
    updateCompanyInfo,
    selectCompanyDepartment,
    insertCompanyInfo,
    selectDepartment,
    selectAllpositionchk,
    deleteCompanyInfo,
    deleteCompanyDepartment,
    selectMemberByPage,
    selectCompanyDepartmentUse,
    selectMemberNick,
    selectDepartId,
    insertMemberApply,
    selectCodechk,
    selectCompanyNamechk,
    updatedAdminInfo,
    selectMemberByIdx,
    updateMemberDepart,
    selectMember,
    deleteMemberOut,
    selectGiftlist,
    insertGift,
    GiftnameChk,
    GiftLogChk,
    selectGiftbyID,
    selectGiftLoglist,
    selectGiftLogID,
    updateAdmitGiftLog,
    updateGiftByid,
    delGiftbyID,
    addGiftOptionbyID,
    chkGift,
    deleteGiftByid,
    selectCloverlists,
    updateMemberPoint,
    selectMemberByID,
    insertClover,


};
