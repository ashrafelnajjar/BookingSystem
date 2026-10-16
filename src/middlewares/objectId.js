const mongoose = require('mongoose');

const objectId = (value, helpers) => {

  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('معرّف (ID) غير صالح');
  }
  return value;
};
module.exports = objectId