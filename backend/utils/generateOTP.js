const crypto = require("crypto");

const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  return { otp, otpExpiry };
};

module.exports = generateOTP;
