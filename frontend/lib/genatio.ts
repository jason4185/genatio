import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";

const IS_TEST = process.env.NEXT_PUBLIC_TEST_MODE === 'true'

export const GENATIO_CONTRACT = IS_TEST
  ? '0xD666F066dCDb27BFFffCc8869c66b2E6A246F1F0'
  : '0xD666F066dCDb27BFFffCc8869c66b2E6A246F1F0'

export const DISPUTE_CONTRACT = IS_TEST
  ? '0x49dbBed1fE59f0c868a71Fc57268b943FddF657d'
  : '0x49dbBed1fE59f0c868a71Fc57268b943FddF657d'

export const genLayerClient = createClient({ chain: glTestnetBradbury });
