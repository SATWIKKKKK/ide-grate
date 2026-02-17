import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL not set - database features disabled')

    // Lightweight stub that mimics PrismaClient model methods used in the app.
    // Methods return reasonable demo values so routes can run without a DB.
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

  const pool = new Pool({
    connectionString,
    max: 10, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
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
