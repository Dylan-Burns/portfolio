import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { site } from "@/content/site";
import { WarpProvider } from "@/components/retro/WarpOverlay";
import "./globals.css";

// Every font is a file in the project (Geist from its npm package, Space Grotesk in ./fonts), so a build never
// depends on reaching Google Fonts.
const spaceGrotesk = localFont({ src: "./fonts/SpaceGrotesk-Variable.woff2", variable: "--font-space-grotesk", weight: "300 700", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: "Dylan Burns, passionate technologist and explorer. Step up to the computer: every project runs on its screen.",
  openGraph: { type: "website", siteName: site.name, url: site.url, images: [{ url: "/burnsos/og.jpg", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <WarpProvider>{children}</WarpProvider>
      </body>
    </html>
  );
}
