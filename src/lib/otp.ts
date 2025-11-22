import speakeasy from "speakeasy";

export function generateOtp(secret: string) {
  return speakeasy.totp({
    secret,
    encoding: "base32",
    step: 120, // 2 minutes
    digits: 6,
  });
}

export function verifyOtp(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    step: 120,
    window: 1,
  });
}
