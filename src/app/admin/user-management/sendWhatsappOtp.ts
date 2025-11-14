export function sendWhatsappOtp(fullNumber: string, otp: string) {
  const message = `🔐 OTP yako ni: ${otp}. Usimpatie mtu mwingine, Umalizapo kutumia futa ujumbe kwa ajili ya usalama nakushukru sana nikutakie wakati mwema🙏`;
  const waLink = `https://wa.me/${fullNumber.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  window.open(waLink, "_blank")?.focus();
}
