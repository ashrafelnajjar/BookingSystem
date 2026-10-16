const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {


    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError("ليس لديك الصلاحية للقيام بهذا الإجراء", 403)
      );
    }
    next();
  };
};
module.exports = restrictTo