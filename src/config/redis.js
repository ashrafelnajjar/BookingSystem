
const createClient  = require("ioredis");
const redis = new createClient(process.env.REDIS_URL);

redis.on("error", (err) => console.log("redis error : ", err));

module.exports = redis;
