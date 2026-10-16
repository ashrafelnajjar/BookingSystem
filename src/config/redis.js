
const createClient  = require("ioredis");
const redis = new createClient(process.env.REDIS_URL);

redis.on("error", (err) => console.log("redis error : ", err));
redis.on(
  "connect",
  () => console.log("redis connect"),
  (async () => {
    await redis.connect();
  })(),
);

module.exports = redis;
