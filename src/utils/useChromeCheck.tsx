"use client";
import { useEffect } from "react";

export function useChromeCheck() {
  useEffect(() => {
    // ✅ Chrome mpya inatoa userAgentData (brand detection)
    const brands = (navigator as any).userAgentData?.brands || [];
    const isChromeBrand = brands.some((b: any) => b.brand === "Google Chrome");

    // ✅ Fallback kwa browsers zisizo na userAgentData
    const ua = navigator.userAgent || "";
    const strictChrome =
      /\bChrome\/\d+/.test(ua) &&
      ua.includes("Safari/537.36") && // Chrome halisi hujumuisha hii
      !ua.includes("Edg") &&          // sio Edge
      !ua.includes("OPR") &&          // sio Opera
      !ua.includes("Brave") &&        // sio Brave
      !ua.includes("Vivaldi") &&      // sio Vivaldi
      !ua.includes("SamsungBrowser") && // sio Samsung browser
      !ua.includes("Phoenix") &&      // sio Phoenix
      !ua.includes("CriOS");          // sio Chrome on iOS (Safari engine)

    // 🚫 Redirect kama sio Chrome halisi
    if (!isChromeBrand && !strictChrome) {
      window.location.href = "/blocked";
    }
  }, []);
}
