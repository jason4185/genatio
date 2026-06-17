"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { SubmissionProvider } from "@/context/SubmissionContext";
import { SubmissionBanner } from "@/components/SubmissionBanner";
import { NetworkGuard } from "@/components/NetworkGuard";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "var(--color-accent-blue)",
            accentColorForeground: "#F0F4FF",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          <SubmissionProvider>
            <NetworkGuard />
            <SubmissionBanner />
            {children}
          </SubmissionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
