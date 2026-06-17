const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

const DEFAULT_TTL = 120_000
export const FUNDERS_TTL = 60_000

export function getCached(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  return entry.data
}

export function setCached(key: string, data: unknown, ttl = DEFAULT_TTL) {
  cache.set(key, { data, timestamp: Date.now(), ttl })
}
