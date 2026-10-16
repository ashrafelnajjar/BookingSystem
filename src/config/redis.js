require("dotenv").config();
const { createClient } = require("redis");
const redis = createClient(process.env.REDIS_URL);

redis.on("error", (err) => console.log("redis error : ", err));
redis.on(
  "connect",
  () => console.log("redis connect"),
  (async () => {
    await redis.connect();
  })(),
);

module.exports = redis;
