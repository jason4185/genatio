import { NextResponse } from "next/server";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { GENATIO_CONTRACT } from "@/lib/genatio";

const client = createClient({ chain: testnetBradbury });

const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 8_000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cacheKey = `project:${id}`;
  const now = Date.now();

  const hit = cache.get(cacheKey);
  if (hit && now - hit.timestamp < TTL) {
    return NextResponse.json(hit.data, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
  }

  const result = await client.readContract({
    address: GENATIO_CONTRACT as `0x${string}`,
    functionName: "get_project",
    args: [id],
  });

  if (!result) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let data: unknown;
  if (typeof result === "string") {
    try {
      data = JSON.parse(result);
    } catch {
      return NextResponse.json({ error: "Failed to parse project data" }, { status: 500 });
    }
  } else {
    data = result;
  }

  cache.set(cacheKey, { data, timestamp: now });

  return NextResponse.json(data, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
