async function selectID(connection, memberID) {
    const Query = `
        select Member.idx, Member.status, Company.status as companyStatus from Member
        join Company on Company.idx = Member.companyIdx where Member.idx = ?;
    `;
    const [resultRow] = await connection.query(Query, memberID);

    return resultRow;
}

async function selectVersionPlatform(connection) {
    const selectVersionQuery = `
        select aosVersion, iosVersion, isAccessable from Version;
    `;
    const [resultRow] = await connection.query(selectVersionQuery);
    return resultRow;
}

async function updateToken(connection, Params) {
    const Query = `
        update Member set firebaseToken = ?, isAos = ? where idx = ?;
    `;
    const resultRow = await connection.query(Query, Params);
    return resultRow;
}

module.exports = {
    selectID,
    selectVersionPlatform,
    updateToken,
};
