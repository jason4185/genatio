import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";

export const GENATIO_CONTRACT = "0x23a0342Edc685fcCb50b3e3C2a86318c93d79942";
export const DISPUTE_CONTRACT = "0x85B70dafE892Aefcd0e75de544dB54Cf113cD88A";

export const genLayerClient = createClient({ chain: glTestnetBradbury });
