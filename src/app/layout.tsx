import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dylan Burns",
  description: "Dylan Burns — software engineer and builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
