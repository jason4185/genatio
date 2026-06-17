import { NextResponse } from 'next/server'
import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import { GENATIO_CONTRACT } from '@/lib/config'

const client = createClient({ chain: testnetBradbury })
const cache = new Map<string, { data: unknown; timestamp: number }>()
const TTL = 8_000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const wallet = searchParams.get('wallet')
  if (!wallet) return NextResponse.json([])

  const bust = searchParams.get('bust')

  if (!bust) {
    const cached = cache.get(wallet)
    if (cached && Date.now() - cached.timestamp < TTL) {
      return NextResponse.json(cached.data)
    }
  }

  const result = await client.readContract({
    address: GENATIO_CONTRACT as `0x${string}`,
    functionName: 'get_rejected_projects',
    args: [wallet],
  })

  const data = JSON.parse(result as string)
  cache.set(wallet, { data, timestamp: Date.now() })
  return NextResponse.json(data)
}
