import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✅ Import both Vercel tools
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina",
  description: "Abel Memorial Programmers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // 🔌 Register Service Worker (manual PWA)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch((err) => console.log("SW registration failed:", err));
    }
  }, []);

  return (
    <html lang="en">
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FFD700" />

        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}

        {/* ✅ Add Vercel Speed Insights (performance metrics) */}
        <SpeedInsights />

        {/* ✅ Add Vercel Analytics (page views, sessions, etc.) */}
        <Analytics />
      </body>
    </html>
  );
}
