import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";

export const GENATIO_CONTRACT =
  process.env.NEXT_PUBLIC_GENATIO_CONTRACT_ADDRESS || '0x9b759C76bCB3e0ACB9Df28dD57575F5c371d2E95'

export const DISPUTE_CONTRACT =
  process.env.NEXT_PUBLIC_GENATIO_DISPUTE_CONTRACT_ADDRESS || '0xd39820b6d9F55231B14e55336AAeeF8a50a61562'

export const genLayerClient = createClient({ chain: glTestnetBradbury });

export const EXPLORER_URL = "https://explorer-bradbury.genlayer.com";
