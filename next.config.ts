import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // The home page is burnsOS 2.0: one self-contained static file (public/burnsos.html, assets in
  // public/burnsos/). There is no app/page.tsx; this rewrite serves the file at "/".
  // The old per-project pages are retired: each address now opens that project on the computer.
  async redirects() {
    return [{ source: "/work/:slug(parahealth|watchtower|remoteretros|outpost|syene|keel|claruss|cartlords|steamhouse)", destination: "/#:slug", permanent: false }];
  },
  async rewrites() {
    // "/opengraph-image" was the old preview image's address. Apps that cached the old page still ask for it, so it
    // now serves the new picture instead of a broken image.
    return { beforeFiles: [{ source: "/", destination: "/burnsos.html" }, { source: "/opengraph-image", destination: "/burnsos/og.jpg" }], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
