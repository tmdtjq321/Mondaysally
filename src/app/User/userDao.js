async function selectID(connection, memberID) {
    const Query = `
        select Member.idx, Member.status, Company.status as companyStatus from Member
        join Company on Company.idx = Member.companyIdx where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);

    return resultRow;
}

async function chkCode(connection, teamCode) {
    const Query = `
        select * from Member WHERE code = ?;
    `;
    const [resultRow] = await connection.query(Query, teamCode);
    return resultRow;
}

async function selectMypage(connection, params) {
    const Query = `
        select Member.nickname, Member.email, Member.imgUrl, CompanyDepartment.department,
               CompanyDepartment.position, Member.gender, Member.bankAccount, Member.phoneNumber,
            year(current_timestamp()) - year(Member.createdAt) as workingYear
                ,Company.name as companyName from Member
            join Company on Member.companyIdx = Company.idx
            join CompanyDepartment on Member.companyDepartmentIdx = CompanyDepartment.idx
        where Member.idx = ?;
    `;
    const resultRow = await connection.query(Query, params);
    return resultRow;
}

async function deleteMembers(connection, memberID) {
    const Query = `
        update Member set status = 'A' where idx = ?;
    `;
    const resultRow = await connection.query(Query, memberID);
    return resultRow;
}

async function updateMemberInfo(connection, params) {
    const Query = `
        UPDATE Member SET nickname = ?, imgUrl = ?, phoneNumber = ?, 
                          bankAccount = ?, email = ? WHERE idx = ?;
    `;
    const resultRow = await connection.query(Query, params);
    return resultRow;
}

module.exports = {
    selectID,
    chkCode,
    selectMypage,
    deleteMembers,
    updateMemberInfo,
    
};
