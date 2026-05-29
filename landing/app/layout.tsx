import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const SITE_URL = "https://romansok.github.io/vuln-analyzer";
// next.config.mjs exposes the base path so we can prefix asset URLs that
// Next won't otherwise rewrite for us (notably metadata.icons).
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "vuln-analyzer — understand vulnerabilities, don't just count them",
    template: "%s · vuln-analyzer",
  },
  description:
    "Agentic vulnerability analyzer for Claude Code and Cursor. Ranks what matters, finds it in your code, and tells you how to fix it.",
  keywords: [
    "vuln-analyzer",
    "vulnerability scanner",
    "grype",
    "Claude Code",
    "Cursor",
    "CVE analyzer",
    "reachability analysis",
    "AI security",
  ],
  authors: [{ name: "Roman Sok", url: "https://github.com/romansok" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "vuln-analyzer",
    description:
      "Ranks what matters, finds it in your code, and tells you how to fix it. Agentic vulnerability analyzer for Claude Code and Cursor.",
    siteName: "vuln-analyzer",
  },
  twitter: {
    card: "summary_large_image",
    title: "vuln-analyzer",
    description:
      "Ranks what matters, finds it in your code, and tells you how to fix it.",
  },
  icons: {
    icon: `${BASE_PATH}/favicon.svg`,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
        {/*
          GoatCounter — privacy-friendly, cookieless analytics.
          The dashboard lives at https://vuln-analyzer.goatcounter.com (login
          required if you set "Data access: only logged-in users"). count.js
          automatically skips localhost, so dev visits are never counted.
        */}
        <Script
          data-goatcounter="https://vuln-analyzer.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
