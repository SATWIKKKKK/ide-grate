import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import prisma from "@/lib/prisma"
import { IDE_CONFIG, type IdeId, isIdeId } from "@/lib/ide-config"
import { normalizeLanguageKey } from "@/lib/languages"

function asJsonObject(value: unknown): Record<string, Prisma.InputJsonValue | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, Prisma.InputJsonValue | null>
}

function parseHeartbeatIde(value: unknown): IdeId | null {
  if (value === undefined || value === null || value === "") return "vscode"
  const candidate = String(value).toLowerCase()
  return isIdeId(candidate) ? candidate : null
}

function extractApiKey(request: NextRequest, body: Record<string, unknown>) {
  const auth = request.headers.get("authorization") || ""
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : ""
  return bearer || (typeof body.apiKey === "string" ? body.apiKey : "")
}

async function findUserByApiKey(apiKey: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { apiKey },
        { ideSetups: { some: { apiKey, isActive: true } } },
      ],
    },
  })
}

async function markIdeConnected(userId: string, ide: IdeId, now: Date) {
  await prisma.userIdeSetup.upsert({
    where: { userId_ide: { userId, ide } },
    update: {
      isActive: true,
      lastHeartbeat: now,
      label: IDE_CONFIG[ide].shortName,
    },
    create: {
      userId,
      ide,
      label: IDE_CONFIG[ide].shortName,
      isActive: true,
      connectedAt: now,
      lastHeartbeat: now,
    },
  })
}

// POST /api/heartbeat - Receive heartbeat from editor integrations.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>
    const ide = parseHeartbeatIde(body.ide)
    if (!ide) {
      return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })
    }

    const apiKey = extractApiKey(request, body)
    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 401 })
    }

    const user = await findUserByApiKey(apiKey)
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const now = new Date(typeof body.timestamp === "string" || typeof body.timestamp === "number" ? body.timestamp : Date.now())
    const language = normalizeLanguageKey(body.language) || "unknown"
    const file = typeof body.file === "string" ? body.file : ""
    const isIdle = Boolean(body.isIdle)
    const type = typeof body.type === "string" ? body.type : ""
    const timezoneOffset = typeof body.timezoneOffset === "number" ? body.timezoneOffset : null
    const localDate = typeof body.localDate === "string" ? body.localDate : null
    const languageBreakdown = normalizeLanguageBreakdown(body.languageBreakdown)

    await markIdeConnected(user.id, ide, now)

    if (type === "connection_test") {
      const updateData: Record<string, Prisma.InputJsonValue | Date | number> = { lastActiveDate: now }
      if (timezoneOffset !== null) {
        const existingStats = await prisma.userStats.findUnique({
          where: { userId: user.id },
          select: { monthlyData: true },
        })
        const md = asJsonObject(existingStats?.monthlyData)
        updateData.monthlyData = { ...md, timezoneOffset }
      }

      await prisma.userStats.upsert({
        where: { userId: user.id },
        update: updateData,
        create: {
          userId: user.id,
          totalHours: 0,
          totalSessions: 0,
          longestStreak: 0,
          currentStreak: 0,
          lastActiveDate: now,
          monthlyData: timezoneOffset !== null ? { timezoneOffset } : {},
        },
      })

      return NextResponse.json({
        success: true,
        message: "Connection verified",
        userId: user.id,
        ide,
      })
    }

    let todayStr: string
    if (localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      todayStr = localDate
    } else if (timezoneOffset !== null) {
      const localTime = new Date(now.getTime() - timezoneOffset * 60000)
      todayStr = localTime.toISOString().split("T")[0]
    } else {
      todayStr = now.toISOString().split("T")[0]
    }
    const today = new Date(todayStr)
    const HEARTBEAT_INTERVAL = 30
    let startedNewSession = false
    let activityDuration = HEARTBEAT_INTERVAL

    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { monthlyData: true },
    })
    const monthlyData = asJsonObject(userStats?.monthlyData)
    const sessionBoundaryByIde = asPlainRecord(monthlyData.sessionBoundaryByIde)
    const hasSessionBoundary = Boolean(sessionBoundaryByIde[ide] ?? (ide === "vscode" ? monthlyData.sessionBoundary : false))

    const dailyContribution = await prisma.dailyContribution.upsert({
      where: {
        userId_date_ide: {
          userId: user.id,
          date: today,
          ide,
        },
      },
      update: {},
      create: {
        userId: user.id,
        ide,
        date: today,
        hours: 0,
        sessions: 0,
        languages: [],
      },
    })

    const lastActivity = await prisma.activity.findFirst({
      where: { userId: user.id, ide },
      orderBy: { endTime: "desc" },
    })

    const createActivity = async (duration = HEARTBEAT_INTERVAL) => prisma.activity.create({
      data: {
        userId: user.id,
        ide,
        startTime: now,
        endTime: now,
        duration,
        language,
        fileType: file ? file.split(".").pop() : null,
        extensions: [],
        idleTime: isIdle ? duration : 0,
        projectHash: typeof body.projectHash === "string" ? body.projectHash : null,
        projectName: typeof body.project === "string" ? body.project : null,
        platform: typeof body.platform === "string" ? body.platform : null,
      },
    })

    if (lastActivity) {
      let lastActivityLocalDate: string
      if (timezoneOffset !== null) {
        const localEndTime = new Date(lastActivity.endTime.getTime() - timezoneOffset * 60000)
        lastActivityLocalDate = localEndTime.toISOString().split("T")[0]
      } else {
        lastActivityLocalDate = lastActivity.endTime.toISOString().split("T")[0]
      }
      const isNewDay = lastActivityLocalDate !== todayStr && !hasSessionBoundary

      if (hasSessionBoundary) {
        startedNewSession = true
        await createActivity()
        await prisma.dailyContribution.update({
          where: { id: dailyContribution.id },
          data: { sessions: { increment: 1 } },
        })
      } else {
        const currentProjectHash = typeof body.projectHash === "string" ? body.projectHash : null
        const projectChanged = currentProjectHash !== (lastActivity.projectHash || null)

        if (projectChanged) {
          await createActivity()
        } else {
          await prisma.activity.update({
            where: { id: lastActivity.id },
            data: {
              endTime: now,
              duration: lastActivity.duration + HEARTBEAT_INTERVAL,
              language: language || lastActivity.language,
              idleTime: isIdle ? lastActivity.idleTime + HEARTBEAT_INTERVAL : lastActivity.idleTime,
            },
          })
        }

        if (isNewDay && dailyContribution.sessions === 0) {
          await prisma.dailyContribution.update({
            where: { id: dailyContribution.id },
            data: { sessions: 1 },
          })
        }
      }
    } else {
      startedNewSession = true
      await createActivity()
      await prisma.dailyContribution.update({
        where: { id: dailyContribution.id },
        data: { sessions: { increment: 1 } },
      })
    }

    const nextSessionBoundaryByIde = { ...sessionBoundaryByIde, [ide]: false }
    const upsertMonthlyData = {
      ...monthlyData,
      sessionBoundary: ide === "vscode" ? false : monthlyData.sessionBoundary,
      sessionBoundaryByIde: nextSessionBoundaryByIde,
      ...(timezoneOffset !== null ? { timezoneOffset } : {}),
    }

    await prisma.userStats.upsert({
      where: { userId: user.id },
      update: {
        lastActiveDate: now,
        ...(startedNewSession ? { totalSessions: { increment: 1 } } : {}),
        monthlyData: upsertMonthlyData,
      },
      create: {
        userId: user.id,
        totalHours: 0,
        totalSessions: startedNewSession ? 1 : 0,
        longestStreak: 0,
        currentStreak: 0,
        lastActiveDate: now,
        monthlyData: timezoneOffset !== null ? { timezoneOffset, sessionBoundaryByIde: nextSessionBoundaryByIde } : { sessionBoundaryByIde: nextSessionBoundaryByIde },
      },
    })

    if (!isIdle) {
      const hoursToAdd = activityDuration / 3600
      const existingLangs = Array.isArray(dailyContribution.languages) ? dailyContribution.languages as string[] : []
      const updatedLangs = language && !existingLangs.includes(language) ? [...existingLangs, language] : existingLangs
      const projectHash = typeof body.projectHash === "string" ? body.projectHash : null
      const existingProjects = Array.isArray(dailyContribution.projects) ? dailyContribution.projects as string[] : []
      const updatedProjects = projectHash && !existingProjects.includes(projectHash) ? [...existingProjects, projectHash] : existingProjects

      await prisma.dailyContribution.update({
        where: { id: dailyContribution.id },
        data: {
          hours: { increment: hoursToAdd },
          languages: updatedLangs,
          projects: updatedProjects,
        },
      })

      await prisma.userStats.update({
        where: { userId: user.id },
        data: { totalHours: { increment: hoursToAdd } },
      })

      if (startedNewSession) {
        await updateStreaks(user.id, todayStr)
      }

      if (Object.keys(languageBreakdown).length > 0) {
        await updateLanguageTotalsFromSnapshot(user.id, ide, languageBreakdown)
      } else if (language && language !== "unknown") {
        await incrementSingleLanguageFallback(user.id, ide, language, HEARTBEAT_INTERVAL)
      }
    }

    if (typeof body.repoUrl === "string" && typeof body.projectHash === "string") {
      await storeProjectRepo(user.id, body.projectHash, body.repoUrl)
    }

    return NextResponse.json({
      success: true,
      message: "Heartbeat recorded",
      ide,
    })
  } catch (error) {
    console.error("Error processing heartbeat:", error)
    return NextResponse.json({ error: "Failed to process heartbeat" }, { status: 500 })
  }
}

function normalizeLanguageBreakdown(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {}
  const normalized: Record<string, number> = {}
  Object.entries(value as Record<string, unknown>).forEach(([language, seconds]) => {
    const key = normalizeLanguageKey(language)
    if (!key) return
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return
    normalized[key] = seconds
  })
  return normalized
}

function asPlainRecord(value: unknown): Record<string, Prisma.InputJsonValue | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, Prisma.InputJsonValue | null>
}

async function updateStreaks(userId: string, todayStr: string) {
  try {
    const recentContribs = await prisma.dailyContribution.findMany({
      where: { userId, hours: { gt: 0 } },
      orderBy: { date: "desc" },
      take: 365,
      select: { date: true },
    })
    const dates = Array.from(new Set(recentContribs.map((c) => new Date(c.date).toISOString().split("T")[0]))).sort().reverse()
    if (dates.length === 0) return

    const streakYesterday = new Date(todayStr)
    streakYesterday.setDate(streakYesterday.getDate() - 1)
    const yesterdayStr = streakYesterday.toISOString().split("T")[0]
    let currentStreak = 0
    let checkDate = dates[0] === todayStr || dates[0] === yesterdayStr ? new Date(dates[0]) : null
    if (checkDate) {
      const dateSet = new Set(dates)
      while (dateSet.has(checkDate.toISOString().split("T")[0])) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    let longestStreak = 1
    let streak = 1
    const allDates = [...dates].reverse()
    for (let i = 1; i < allDates.length; i++) {
      const diffDays = (new Date(allDates[i]).getTime() - new Date(allDates[i - 1]).getTime()) / 86400000
      streak = diffDays === 1 ? streak + 1 : 1
      longestStreak = Math.max(longestStreak, streak)
    }
    await prisma.userStats.update({
      where: { userId },
      data: {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
      },
    })
  } catch {
    // Non-critical: analytics can be recomputed by read routes.
  }
}

async function updateLanguageTotalsFromSnapshot(userId: string, ide: IdeId, snapshot: Record<string, number>) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { topLanguages: true, monthlyData: true },
  })

  const monthlyData = asJsonObject(stats?.monthlyData)
  const snapshotsByIde = asPlainRecord(monthlyData.languageSnapshotsByIde)
  const previousSnapshot = normalizeLanguageBreakdown(snapshotsByIde[ide])
  const totals = parseLanguageTotals(stats?.topLanguages)
  const totalsByIde = asPlainRecord(monthlyData.languageTotalsByIde)
  const ideTotals = parseLanguageTotals(totalsByIde[ide])

  Object.entries(snapshot).forEach(([language, currentSeconds]) => {
    const previousSeconds = previousSnapshot[language] || 0
    const delta = currentSeconds - previousSeconds
    const secondsToAdd = delta >= 0 ? delta : currentSeconds
    if (secondsToAdd > 0) {
      totals[language] = (totals[language] || 0) + secondsToAdd
      ideTotals[language] = (ideTotals[language] || 0) + secondsToAdd
    }
  })

  await prisma.userStats.update({
    where: { userId },
    data: {
      topLanguages: totals,
      monthlyData: {
        ...monthlyData,
        languageSnapshot: ide === "vscode" ? snapshot : monthlyData.languageSnapshot,
        languageSnapshotsByIde: { ...snapshotsByIde, [ide]: snapshot },
        languageTotalsByIde: { ...totalsByIde, [ide]: ideTotals },
      },
    },
  })
}

async function incrementSingleLanguageFallback(userId: string, ide: IdeId, language: string, secondsToAdd: number) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { topLanguages: true, monthlyData: true },
  })

  const totals = parseLanguageTotals(stats?.topLanguages)
  const monthlyData = asJsonObject(stats?.monthlyData)
  const totalsByIde = asPlainRecord(monthlyData.languageTotalsByIde)
  const ideTotals = parseLanguageTotals(totalsByIde[ide])
  const key = normalizeLanguageKey(language)
  if (!key) return
  totals[key] = (totals[key] || 0) + secondsToAdd
  ideTotals[key] = (ideTotals[key] || 0) + secondsToAdd

  await prisma.userStats.update({
    where: { userId },
    data: {
      topLanguages: totals,
      monthlyData: {
        ...monthlyData,
        languageTotalsByIde: { ...totalsByIde, [ide]: ideTotals },
      },
    },
  })
}

function parseLanguageTotals(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  Object.entries(raw as Record<string, unknown>).forEach(([language, seconds]) => {
    if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
      const key = normalizeLanguageKey(language)
      if (key) out[key] = seconds
    }
  })
  return out
}

async function storeProjectRepo(userId: string, projectHash: string, repoUrl: string) {
  try {
    const userStats = await prisma.userStats.findUnique({
      where: { userId },
      select: { monthlyData: true },
    })
    const monthlyData = asJsonObject(userStats?.monthlyData)
    const projectRepos = asPlainRecord(monthlyData.projectRepos) as Record<string, string>
    if (projectRepos[projectHash] === repoUrl) return
    projectRepos[projectHash] = repoUrl
    await prisma.userStats.update({
      where: { userId },
      data: { monthlyData: { ...monthlyData, projectRepos } },
    })
  } catch {
    // Non-critical display enrichment.
  }
}

// GET /api/heartbeat/status - Check if editor tracking is working.
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  const { searchParams } = new URL(request.url)
  const ideParam = searchParams.get("ide")
  const ide = ideParam ? parseHeartbeatIde(ideParam) : null

  if (ideParam && !ide) {
    return NextResponse.json({ error: "Unsupported IDE" }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API key required in x-api-key header or Bearer auth" }, { status: 401 })
  }

  const user = await findUserByApiKey(apiKey)
  if (!user) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  const lastActivity = await prisma.activity.findFirst({
    where: {
      userId: user.id,
      ...(ide ? { ide } : {}),
    },
    orderBy: { endTime: "desc" },
  })

  return NextResponse.json({
    connected: true,
    userId: user.id,
    ide: ide || "combined",
    lastActivityAt: lastActivity?.endTime || null,
  })
}
