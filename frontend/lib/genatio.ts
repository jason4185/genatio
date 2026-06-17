import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";

export const GENATIO_CONTRACT = "0x544B6dEb105a02f585f0Aa3aef6398B5E9cD5B77";
export const DISPUTE_CONTRACT = "0x4dE9635b81DbfbC9E590C868d698dAF09f20C46E";

export const genLayerClient = createClient({ chain: glTestnetBradbury });
