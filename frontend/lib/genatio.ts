import { createClient } from "genlayer-js";
import { testnetBradbury as glTestnetBradbury } from "genlayer-js/chains";

export const GENATIO_CONTRACT = "0x23a0342Edc685fcCb50b3e3C2a86318c93d79942";
export const DISPUTE_CONTRACT = "0x569c9E3C9Ac23444D334710e507E1035fe09283F";

export const genLayerClient = createClient({ chain: glTestnetBradbury });
