import crypto from "crypto";

export function generateOtp(length = 6) {
  let otp = "";

  while (otp.length < length) {
    const bytes = crypto.randomBytes(length);
    otp += bytes
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
  }

  return otp.slice(0, length);
}
