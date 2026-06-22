import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { site } from "@/content/site";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ParticleField } from "@/components/visuals/ParticleField";
import { PageTransition } from "@/components/motion/PageTransition";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s · ${site.name}` },
  description: "Builder and founder shipping software products end to end — Parahealth, Claruss, and more.",
  openGraph: { type: "website", siteName: site.name, url: site.url },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh antialiased">
        <ParticleField />
        <Nav />
        <PageTransition>{children}</PageTransition>
        <Footer />
      </body>
    </html>
  );
}
