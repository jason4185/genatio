import { NextResponse } from "next/server";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { GENATIO_CONTRACT } from "@/lib/genatio";

const client = createClient({ chain: testnetBradbury });

const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 60_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "";
  const cacheKey = `projects:${status}`;
  const now = Date.now();

  const hit = cache.get(cacheKey);
  if (hit && now - hit.timestamp < TTL) {
    return NextResponse.json(hit.data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  }

  const result = await client.readContract({
    address: GENATIO_CONTRACT as `0x${string}`,
    functionName: "get_projects",
    args: [status],
  });

  let data: unknown;
  if (typeof result === "string") {
    try {
      data = JSON.parse(result);
    } catch {
      data = [];
    }
  } else {
    data = result ?? [];
  }

  cache.set(cacheKey, { data, timestamp: now });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
