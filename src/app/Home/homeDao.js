async function selectID(connection, memberID) {
    const Query = `
        select Member.nickname, Member.imgUrl, Member.companyIdx as companyIdx, Company.logoImgUrl,
               sum(timestampdiff(hour,Work.workOn,Work.workOff)) as totalWorkTime,
               Member.status, Member.accumulatedClover, Member.currentClover,
               (Member.accumulatedClover - Member.currentClover) as usedClover, Company.status as companyStatus from Member
               join Company on Company.idx = Member.companyIdx
               left join Work on Work.memberIdx = Member.idx and Work.status = 'ACTIVE'
            and Work.workOff is not null
        where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);
    if (!resultRow[0].totalWorkTime) {
        resultRow[0].totalWorkTime = '0';
    }

    return resultRow;
}

async function getGiftHistory(connection, memberID) {
    const Query = `
        select GiftLog.idx as giftLogIdx, Gift.imgUrl, GiftLog.isAccepted, GiftLog.isProved, Twinkle.idx as twinkleIdx,
               Gift.name, GiftLog.usedClover from GiftLog
               join Gift on GiftLog.giftIdx = Gift.idx
               left join Twinkle on Twinkle.giftLogIdx = GiftLog.idx
        where GiftLog.memberIdx = ? and GiftLog.status = 'ACTIVE'
        order by GiftLog.createdAt desc limit 5;
    `;
    const [resultRow] = await connection.query(Query, memberID);
    return resultRow;
}

async function getRank(connection,companyIdx) {
    const Query = `
        select imgUrl, nickname, currentClover
        from Member where (Member.status = 'W' or Member.status = 'L') and companyIdx = ?
        order by currentClover desc limit 3;
    `;
    const [resultRow] = await connection.query(Query,companyIdx);
    return resultRow;
}

async function selectHome(connection, id) {
    const Query4 = `
        select Member.status, Member.nickname, CompanyDepartment.department,
               CompanyDepartment.position from Member
        join CompanyDepartment on CompanyDepartment.idx = Member.companyDepartmentIdx
        where Member.companyIdx = ? and (Member.status = 'W');
    `;

    const [Row] = await connection.query(Query4, id);

    return Row;
}

module.exports = {
    selectID,
    getGiftHistory,
    getRank,
    selectHome,

};
