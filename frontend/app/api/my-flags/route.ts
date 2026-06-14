import { NextResponse } from "next/server";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { GENATIO_CONTRACT, DISPUTE_CONTRACT } from "@/lib/genatio";

const client = createClient({ chain: testnetBradbury });
const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 60_000;

interface ContractFlag {
  id: string;
  project_id: string;
  raised_by: string;
  flag_reasons: string;
  status: string;
  resolution: string;
  created_at: string;
}

interface ProjectRecord {
  id: string | number;
  title: string;
}

export interface ContractFlagResult {
  projectId: string;
  projectTitle: string;
  resolution: "VALID" | "INVALID";
  reason: string;
  raisedAt: string;
}

function parseJson(raw: unknown): unknown {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = (searchParams.get("wallet") ?? "").toLowerCase().trim();

  if (!wallet) return NextResponse.json([]);

  const cacheKey = `my-flags:${wallet}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && now - hit.timestamp < TTL) return NextResponse.json(hit.data);

  // Fetch all projects
  let projects: ProjectRecord[] = [];
  try {
    const result = await client.readContract({
      address: GENATIO_CONTRACT as `0x${string}`,
      functionName: "get_projects",
      args: [""],
    });
    const raw = parseJson(result);
    projects = Array.isArray(raw) ? (raw as ProjectRecord[]) : [];
  } catch {
    return NextResponse.json([]);
  }

  // Check flags for each project in parallel
  const settled = await Promise.allSettled(
    projects.map(async (project): Promise<ContractFlagResult | null> => {
      const projectId = String(project.id);
      try {
        const result = await client.readContract({
          address: DISPUTE_CONTRACT as `0x${string}`,
          functionName: "get_flags",
          args: [projectId],
        });
        const flag = parseJson(result) as ContractFlag | null;
        if (!flag || typeof flag !== "object") return null;
        if ((flag.raised_by ?? "").toLowerCase() !== wallet) return null;

        const resStr = flag.resolution ?? "";
        const isValid = resStr.trim().toUpperCase().startsWith("VALID");
        const reason = resStr.replace(/^(VALID|INVALID)\s*[-–]?\s*/i, "").trim();

        return {
          projectId,
          projectTitle: String(project.title),
          resolution: isValid ? "VALID" : "INVALID",
          reason,
          raisedAt: flag.created_at ?? "",
        };
      } catch {
        return null;
      }
    })
  );

  const flags: ContractFlagResult[] = settled
    .filter(
      (r): r is PromiseFulfilledResult<ContractFlagResult> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);

  cache.set(cacheKey, { data: flags, timestamp: now });
  return NextResponse.json(flags);
}
