// ✅ Extra browser types
interface NavigatorUADataBrand {
  brand: string;
  version: string;
}

interface NavigatorUAData {
  brands: NavigatorUADataBrand[];
  mobile: boolean;
  platform: string;
}

interface Navigator {
  userAgentData?: NavigatorUAData;
}

// ✅ External libraries without type definitions
declare module "speakeasy";
declare module "qrcode";
declare module "bcryptjs";
declare module "jsonwebtoken";

// ✅ Allow CSS imports in TS/Next.js
declare module "*.css";
