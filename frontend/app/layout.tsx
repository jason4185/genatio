import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AnimatedBackground from "@/components/AnimatedBackground";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
      <body
        className={`${jakarta.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
        style={{ backgroundColor: "#060B18", color: "#F0F4FF" }}
      >
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
