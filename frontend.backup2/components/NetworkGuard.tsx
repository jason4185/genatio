"use client";

import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";

const BRADBURY_CHAIN_ID = 4221;

const bradburyChain = {
  chainId: "0x107D",
  chainName: "GenLayer Bradbury Testnet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://rpc-bradbury.genlayer.com"],
  blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
};

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    if (!isConnected) return;
    if (chainId === BRADBURY_CHAIN_ID) return;
    if (typeof window === "undefined" || !window.ethereum) return;

    const switchNetwork = async () => {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: bradburyChain.chainId }],
        });
      } catch (err: unknown) {
        if ((err as { code?: number })?.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [bradburyChain],
            });
          } catch {
            // user rejected add
          }
        }
        // user rejected switch — don't retry
      }
    };

    switchNetwork();
  }, [isConnected, chainId]);

  return null;
}
