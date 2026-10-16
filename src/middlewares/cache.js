const redis = require("../config/redis");

const cache =
  ({ ttl = 60, prefix = "cache", perUser = false } = {}) =>
  async (res, req, next) => {
    if (req.method !== "GET") return next();
    const userPart = perUser ? `:u:${req.user?.id || "anon"}` : "";
    const key = `${prefix}${userPart}:${req.originalUrl}`;
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.set("X-cache", "HIT");
        return res.json(JSON.parse(cached));
      }
    } catch (err) {}
    res.set("X-cache", "MISS");
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.status >= 200 && res.status < 300) {
        redis.set(key, JSON.stringify(body), "EX", ttl).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };

module.exports = cache;
