import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  icons: {
    icon: "/favicon.svg",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
