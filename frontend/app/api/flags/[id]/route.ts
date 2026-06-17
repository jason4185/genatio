import { NextResponse } from 'next/server'
import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import { DISPUTE_CONTRACT } from '@/lib/config'

const client = createClient({ chain: testnetBradbury })
const cache = new Map<string, { data: unknown; timestamp: number }>()
const TTL = 8_000

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cached = cache.get(id)
  if (cached && Date.now() - cached.timestamp < TTL) {
    return NextResponse.json(cached.data)
  }
  const result = await client.readContract({
    address: DISPUTE_CONTRACT as `0x${string}`,
    functionName: 'get_flags',
    args: [id],
  })
  const data = JSON.parse(result as string)
  cache.set(id, { data, timestamp: Date.now() })
  return NextResponse.json(data)
}
