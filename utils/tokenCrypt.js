const crypto = require('crypto');
module.exports = (resetToken, method = 'sha256') => {
  return crypto.createHash(method).update(resetToken).digest('hex');
};
