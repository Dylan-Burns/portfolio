import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // The home page is burnsOS 2.0: one self-contained static file (public/burnsos.html, assets in
  // public/burnsos/). There is no app/page.tsx; this rewrite serves the file at "/".
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/burnsos.html" }], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
