"use client";
import { useEffect } from "react";

export function useChromeCheck() {
  useEffect(() => {
    // Chrome mpya inatoa userAgentData
    const brands = navigator.userAgentData?.brands || [];
    const isChrome = brands.some(b => b.brand === "Google Chrome");

    // Fallback kwa browsers ambazo hazina userAgentData
    const ua = navigator.userAgent || "";
    const strictChrome =
      /\bChrome\/\d+/.test(ua) &&
      !ua.includes("Edg") &&
      !ua.includes("OPR") &&
      !ua.includes("Brave") &&
      !ua.includes("SamsungBrowser") &&
      !ua.includes("Phoenix") &&
      !ua.includes("CriOS");

    if (!isChrome && !strictChrome) {
      window.location.href = "/blocked";
    }
  }, []);
}
