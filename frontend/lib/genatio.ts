import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";

export const GENATIO_CONTRACT = "0x2833bb75f01F3B7F70120dDa34608fD86A5e8E73";
export const DISPUTE_CONTRACT = "0x45fAAb2B42F5AAB6f32cFa0D5F45b93Ed8Bf419f";

export const genLayerClient = createClient({ chain: glTestnetBradbury });
