const Redis = require('redis');
const client = Redis.createClient(6379);

client.on('error', function (err) {
    console.log('Error ' + err);
});

module.exports = {
    client: client
};