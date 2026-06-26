import type { NextConfig } from "next";

const backendUrl =
  process.env.MAIN_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_MAIN_SITE_URL?.trim() ||
  "https://techflaresolutionsback.onrender.com";

const frontendUrl =
  process.env.MAIN_FRONTEND_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://techflaresolutionss.vercel.app";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_MAIN_SITE_URL: backendUrl.replace(/\/$/, ""),
    NEXT_PUBLIC_MAIN_FRONTEND_URL: frontendUrl.replace(/\/$/, ""),
  },
};

export default nextConfig;
