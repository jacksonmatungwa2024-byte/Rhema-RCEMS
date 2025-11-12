export async function sendWhatsappOtp(user: any, otp: string) {
  const countryCode = user.metadata?.country_code || "255";
  const phone = user.metadata?.phone || "";

  if (!phone) {
    alert("⚠️ Mtumiaji hana namba ya simu kwenye metadata.");
    return;
  }

  const message = `Habari ${user.full_name},\n\nHii ni OTP yako ya kubadilisha nenosiri: *${otp}*\nInatumika kwa dakika 10 pekee.\n\nRhema RCEMS`;
  const link = `https://wa.me/${countryCode}${phone}?text=${encodeURIComponent(
    message
  )}`;

  window.open(link, "_blank");
}
