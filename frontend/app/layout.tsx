import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Genatio — Trustless Grants for Open Source",
  description:
    "Intelligent Contracts on GenLayer verify every open source project on-chain. No humans. No middlemen. The chain decides.",
  openGraph: {
    title: "Genatio — Trustless Grants for Open Source",
    description:
      "Intelligent Contracts on GenLayer verify every open source project on-chain. No humans. No middlemen. The chain decides.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
        style={{ backgroundColor: "#080B14", color: "#F8F9FA" }}
      >
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
