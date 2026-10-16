const redis = require("../config/redis");

const clearcache = async (prefix) => {
  const stream = redis.scanStream({ match: `${prefix}:*`, count: 100 });
  stream.on("data", (keys) => {
    if (keys.length) redis.unlink(...keys);
  });
  await new Promise((resolve, reject) => {
    stream.on("end", resolve);
    stream.on("error", reject);
  });
};
module.exports = clearcache
