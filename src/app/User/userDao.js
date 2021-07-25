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
                FROM Company where adminId = ?;
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
        select TRUNCATE(sum(Clover.clover),0) as accumulatedClover, A.usedClover
        from Clover join (select companyIdx, TRUNCATE(sum(clover),0) as usedClover
        from Clover where workIdx is null and companyIdx = ? and status = 'ACTIVE') as A
        on A.companyIdx = Clover.companyIdx
        where workIdx is not null and status = 'ACTIVE';
    `;
    const moneyQuery = `select sum(GiftOption.money) as money from Clover
    join GiftOption on GiftOption.idx = Clover.optionIdx
    where Clover.companyIdx = ?;`

    const [resultRow] = await connection.query(Query, companyIdx);
    resultRow[0].accumulatedClover = parseInt(resultRow[0].accumulatedClover);
    resultRow[0].usedClover = parseInt(resultRow[0].usedClover);
    resultRow[0].currentClover = resultRow[0].accumulatedClover - resultRow[0].usedClover;
    const [Row] = await connection.query(moneyQuery, companyIdx);
    resultRow[0].money = Row[0].money;

    return resultRow[0];
}

async function selectMonthCompanyList(connection, companyIdx) {
    const Query = `  
        select date_format(Clover.createdAt, '%Y-%m') as date, TRUNCATE(sum(clover),0) as accumulatedClover
        from Clover WHERE workIdx is not null and companyIdx = ? and Clover.status = 'ACTIVE' and 
            date_format(Clover.createdAt, '%Y-%m') like concat ('%', year (now()), '%') group by date;
    `; // 누적

    const monthQuery = `select date_format(Clover.createdAt,'%Y-%m') as date, TRUNCATE(sum(Clover.clover),0) as usedClover, 
        sum(GiftOption.money) as money from Clover
        join GiftOption on GiftOption.idx = Clover.optionIdx where Clover.companyIdx = ? and workIdx is null
        and Clover.status = 'ACTIVE' and date_format(Clover.createdAt,'%Y-%m') like concat ('%', year (now()), '%')
        group by date;`;  // 사용 환산

    var Row = [];
    var chk = {};
    var [resultRow] = await connection.query(Query, companyIdx);
    for (let i = 0; i < resultRow.length; i++){
        var date = resultRow[i].date;
        chk[date] = resultRow[i];
    }
    var [monthRow] = await connection.query(monthQuery, companyIdx);
    for (let i = 0; i < monthRow.length; i++){
        var date = monthRow[i].date;
        if (chk.hasOwnProperty(date)){
            chk[date].usedClover = monthRow[i].usedClover;
            chk[date].money = parseInt(monthRow[i].money);
        }
        else{
            monthRow[i].accumulatedClover = 0;
            chk[date] = monthRow[i];
        }
    }

    for (var key in chk){
        if (!chk[key].usedClover){chk[key].usedClover = 0;}
        if (!chk[key].money){chk[key].money = 0;}
        Row.push(chk[key]);
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
        count(GiftLog.idx) as giftRequestCount from GiftLog
        where date_format(GiftLog.createdAt, '%Y-%m') and GiftLog.status = 'ACTIVE'
            like concat ('%' , year(now()), '%') group by date;
    `;
    const [Row] = await connection.query(Query);

    return Row;
}

async function selectGiftrequest(connection,companyIdx) {
    const Query = `
        select Gift.name, Gift.imgUrl, Gift.info,Gift.rule, count(GiftLog.idx) as giftRequest
        from GiftLog join Gift on Gift.idx = GiftLog.giftIdx and GiftLog.status = 'ACTIVE'
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
    const [Row] = await connection.query(Query,params);

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
            companyDepartmentIdx = ? and (status = 'W' or status = 'L');
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
        select * from CompanyDepartment where companyIdx = ? and department = ?
        and position = ?;
    `;
    const [Row] = await connection.query(Query,params);

    return Row;
}

async function selectMemberByPage(connection,parmas){
    const allQuery = `
        select imgUrl, nickname, department, position from Member join CompanyDepartment
         on CompanyDepartment.idx = Member.companyDepartmentIdx
        where (Member.status = 'W' or Member.status = 'L') and Member.companyIdx = ?;
    `;
     const Query = `
         select imgUrl, nickname, department, position from Member join CompanyDepartment
             on CompanyDepartment.idx = Member.companyDepartmentIdx
         where (Member.status = 'W' or Member.status = 'L') and Member.companyIdx = ?
             limit ?, 30;
    `;
    var obj = {};
    const [allRow] = await connection.query(allQuery,parmas[0]);
    const [Row] = await connection.query(Query,parmas);
    obj.totalCount = allRow.length;
    obj.members = Row;

    return obj;
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
            Member.phoneNumber, Member.bankAccount, Member.address, Member.status
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

async function selectGiftlist(connection,params){
    const AQuery = `
        select imgUrl, name from Gift where status = 'ACTIVE' and companyIdx = ?;
    `;
    const Query = `
        select imgUrl, name from Gift where status = 'ACTIVE' and companyIdx = ?
        limit ?, 30;
    `;
    var obj = {};
    console.log(params[0]);
    const [Row] = await connection.query(AQuery,params[0]);
    const [Result] = await connection.query(Query,params);
    obj.totalCount = Row.length;
    obj.gifts = Result;

    return obj;
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

async function selectGiftLoglist(connection,companyIdx,page){
    const Query = `
        select GiftLog.idx, Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
            date_format(GiftLog.createdAt,'%Y-%m-%d %H:%i:%s') as createdAt from GiftLog
            join Gift on GiftLog.giftIdx = Gift.idx
            join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE';
    `;
    const Query2 = `
        select GiftLog.idx, Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
                date_format(GiftLog.createdAt,'%Y-%m-%d %H:%i:%s') as createdAt
        from GiftLog
                 join Gift on GiftLog.giftIdx = Gift.idx
                 join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and GiftLog.isAccepted is null;
    `;
    const Query3 = `
        select GiftLog.idx, Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
               date_format(GiftLog.createdAt,'%Y-%m-%d %H:%i:%s') as createdAt
        from GiftLog
                 join Gift on GiftLog.giftIdx = Gift.idx
                 join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and GiftLog.isAccepted = 'N';
    `;
    const Query4 = `
        select GiftLog.idx, Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
               date_format(GiftLog.createdAt,'%Y-%m-%d %H:%i:%s') as createdAt
        from GiftLog
                 join Gift on GiftLog.giftIdx = Gift.idx
                 join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and GiftLog.isAccepted = 'Y';
    `;
    let start = (page-1) * 30;
    const result = {};
    const [Row] = await connection.query(Query,companyIdx);
    const [Row2] = await connection.query(Query2,companyIdx);   // 승인대기
    const [Row3] = await connection.query(Query3,companyIdx);   // 승인거부
    const [Row4] = await connection.query(Query4,companyIdx);   // 승인완료
    var Rowpage = {'totalCount': Row.length,giftLogs : []};
    var Rowpage2 = {'totalCount': Row2.length, giftLogs : []};
    var Rowpage3 = {'totalCount': Row3.length, giftLogs : []};
    var Rowpage4 = {'totalCount': Row4.length, giftLogs : []};
    for (let i = start, m = 0; i < start + 30; i++,m++){
        if (m == 30){
            break;
        }
        if (Row[i]){
            Rowpage.giftLogs.push(Row[i]);
        }
        if (Row2[i]){
            Rowpage2.giftLogs.push(Row2[i]);
        }
        if (Row3[i]){
            Rowpage3.giftLogs.push(Row3[i]);
        }
        if (Row4[i]){
            Rowpage4.giftLogs.push(Row4[i]);
        }
    }
    result.allGiftLog = Rowpage;
    result.permissionWaitGiftLog = Rowpage2;
    result.permissionRejectGiftLog = Rowpage3;
    result.permissionCompleteGiftLog = Rowpage4;

    return result;
}

async function selectGiftLoglistbyMonth(connection,companyIdx,page,month){
    const Query = `
        select GiftLog.idx, Member.imgUrl, Member.nickname, Gift.name, GiftLog.isAccepted,
               date_format(GiftLog.createdAt,'%Y-%m-%d %H:%i:%s') as createdAt from GiftLog
               join Gift on GiftLog.giftIdx = Gift.idx
               join Member on Member.idx = GiftLog.memberIdx
        where Gift.companyIdx = ? and GiftLog.status = 'ACTIVE' and
            date_format(GiftLog.createdAt,'%y-%m') = ?;
    `;
    const params = [companyIdx,month];
    console.log(params);
    const [Row] = await connection.query(Query,params);
    let start = (page-1) * 30;
    var Rowpage = {'totalCount' : Row.length,'giftLogs' : []}
    for (let i = start, m = 0; i < start + 30; i++,m++){
        if (m == 30 || i == Row.length){
            break;
        }
        if (Row[i]){
            Rowpage.giftLogs.push(Row[i]);
        }
    }

    return Rowpage;
}

async function selectGiftLogID(connection,giftLogID){
    const Query = `
        select Gift.imgUrl as giftImgUrl, Gift.name, Member.nickname, GiftLog.isAccepted,
               Twinkle.receiptImgUrl, TwinkleImg.imgUrl, Twinkle.createdAt, GiftOption.usedClover, GiftOption.money
        from GiftLog join Member on Member.idx = GiftLog.memberIdx
                     join Gift on GiftLog.giftIdx = Gift.idx
                     join GiftOption on GiftOption.usedClover = GiftLog.usedClover and GiftOption.giftIdx = GiftLog.giftIdx
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

async function updateMemberPoint(connection,params){
    const Query = `
        update Member set currentClover = ? where idx = ?;
    `;

    const [Row] = await connection.query(Query,params);
    return Row;
}

async function selectCloverlists(connection,ID){
    const Query = `
        select Member.idx, Member.nickname, Member.imgUrl as memberImg,CompanyDepartment.department,
               CompanyDepartment.position, Member.accumulatedClover,
               (Member.accumulatedClover - Member.currentClover) as usedClover,
               Member.currentClover, A.money from Member
               join CompanyDepartment on Member.companyDepartmentIdx = CompanyDepartment.idx
               left join (select Clover.memberIdx, sum(GiftOption.money) as money from Clover
               join GiftOption on Clover.optionIdx = GiftOption.idx
               where Clover.companyIdx = ? and Clover.workIdx is null and Clover.status ='ACTIVE'
               group by Clover.memberIdx) as A on A.memberIdx = Member.idx
        where Member.companyIdx = ? limit ?, 30;
    `;

    const [Row] = await connection.query(Query,ID);
    for (let i = 0; i < Row.length; i++){
        if (!Row[i].money){
            Row[i].money = '0';
        }
    }
    return Row;
}

async function monthCloverlists(connection,param){
    const Query = `
        select Member.idx, Member.nickname, Member.imgUrl as memberImg,CompanyDepartment.department,
               CompanyDepartment.position, A.money, sum(truncate(Clover.clover,0)) as accumulatedClover,
               A.usedClover from Member
               join Clover on Member.idx = Clover.memberIdx
               join CompanyDepartment on Member.companyDepartmentIdx = CompanyDepartment.idx
               left join (select memberIdx, sum(truncate(Clover.clover,0)) as usedClover,
               sum(GiftOption.money) as money from Clover join GiftOption on GiftOption.idx = Clover.optionIdx
               where workIdx is null and Clover.status = 'ACTIVE' group by memberIdx) as A on A.memberIdx = Member.idx
            where Clover.companyIdx = ? and Clover.status = 'ACTIVE' and workIdx is not null
          and date_format(Clover.createdAt,'%Y-%m') = ? group by Member.idx
        order by Member.idx limit ?, 30;
    `;

    const [Row] = await connection.query(Query,param);
    return Row;
}

async function selectMemberByID(connection,memberID){
    const Query = `
        select * from Member where idx = ? and (status = 'W' or status = 'L');
    `;

    const [Row] = await connection.query(Query,memberID);
    return Row;
}

async function insertClover(connection,GiftLogID){
    const Query = `insert into Clover(memberIdx,giftIdx,optionIdx,companyIdx,clover)
    select GiftLog.memberIdx, GiftLog.giftIdx ,GiftOption.idx, 
    Member.companyIdx,GiftLog.usedClover from GiftLog 
    join GiftOption on GiftOption.usedClover = GiftLog.usedClover 
    and GiftOption.giftIdx = GiftLog.giftIdx
    join Member on Member.idx = GiftLog.memberIdx
    where GiftLog.idx = ?;`;
    const [Row] = await connection.query(Query,GiftLogID);
    return Row;
}

async function activateCompanyInfo(connection,params){
    const Query = `update CompanyDepartment set status = 'ACTIVE' where idx = ?;`;

    const [Row] = await connection.query(Query,params);
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
    selectGiftLoglistbyMonth,
    activateCompanyInfo,
    monthCloverlists,


};
