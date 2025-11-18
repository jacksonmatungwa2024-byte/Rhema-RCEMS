import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)", // routes zote
        headers: [
          { key: "X-Frame-Options", value: "DENY" }, // zuia iframe embedding
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, // zuia kutumika kwenye apps zingine
          { key: "Referrer-Policy", value: "same-origin" }, // ruhusu referrer kutoka domain yako tu
          { key: "X-Robots-Tag", value: "noindex, nofollow" }, // zuia indexing na search engines
        ],
      },
    ];
  },
};

export default nextConfig;
