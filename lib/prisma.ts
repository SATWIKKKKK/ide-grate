import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL not set - database features disabled')

    const methodHandler: ProxyHandler<any> = {
      get(_, prop: string) {
        return async (..._args: any[]) => {
          switch (prop) {
            case 'findMany':
              return []
            case 'findUnique':
            case 'findFirst':
              return null
            case 'create':
              return { id: `demo-${Date.now()}`, ...( _args[0]?.data ?? {} ) }
            case 'update':
            case 'upsert':
              return _args[0]?.data ?? {}
            case 'count':
              return 0
            default:
              return null
          }
        }
      }
    }

    const stub = new Proxy({}, {
      get(_, _modelName: string) {
        return new Proxy({}, methodHandler)
      }
    })

    return stub as unknown as PrismaClient
  }

  // Standard pg Pool works with both Neon and any PostgreSQL host.
  // Neon supports standard PostgreSQL wire protocol — no special driver needed.
  const needsSsl = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech')

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof createPrismaClient>
} & typeof global

const prisma = globalThis.prismaGlobal ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma
