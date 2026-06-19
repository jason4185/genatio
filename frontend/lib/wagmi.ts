import { http } from "wagmi";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { testnetBradbury } from "genlayer-js/chains";

export { testnetBradbury };

export const config = getDefaultConfig({
  appName: "Genatio",
  projectId: "4306cc958be66e1dea5dc4e3c9a84ac4",
  chains: [testnetBradbury],
  transports: {
    [testnetBradbury.id]: http("https://rpc-bradbury.genlayer.com"),
  },
  ssr: true,
});
