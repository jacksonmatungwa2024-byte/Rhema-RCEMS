export function sendWhatsappOtp(fullNumber: string, otp: string) {
  const message = `🔐 OTP yako ni: ${otp}. Usipishie mtu mwingine.`;
  const waLink = `https://wa.me/${fullNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  window.open(waLink, "_blank")?.focus();
}
