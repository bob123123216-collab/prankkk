import { Pool } from "pg"

declare global {
  // eslint-disable-next-line no-var
  var _cashPool: Pool | undefined
}

// Prefer the pooled Neon URL, then fall back to the common alternatives the
// Neon/Vercel integration may expose.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  throw new Error(
    "No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in your environment.",
  )
}

// Reuse a single pool across hot reloads in dev.
export const pool =
  global._cashPool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

if (process.env.NODE_ENV !== "production") {
  global._cashPool = pool
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const res = await pool.query(text, params)
  return res.rows as T[]
}
