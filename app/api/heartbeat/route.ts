import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// POST /api/heartbeat - Receive heartbeat from VS Code extension
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      apiKey, 
      timestamp, 
      language, 
      project, 
      file,
      isIdle = false,
      type, // 'connection_test' for initial connection verification
      timezoneOffset,
      localDate,
    } = body

    const languageBreakdown = normalizeLanguageBreakdown(body.languageBreakdown)

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 401 }
      )
    }

    // Find user by API key
    const user = await prisma.user.findFirst({
      where: { 
        apiKey: apiKey 
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    // Connection test: validate key and return without creating activity
    if (type === 'connection_test') {
      // Store timezone offset if provided
      const updateData: Record<string, unknown> = { lastActiveDate: new Date() }
      if (typeof timezoneOffset === 'number') {
        const existingStats = await prisma.userStats.findUnique({
          where: { userId: user.id },
          select: { monthlyData: true },
        })
        const md = (existingStats?.monthlyData as Record<string, unknown>) || {}
        updateData.monthlyData = { ...md, timezoneOffset }
      }
      // Update lastActiveDate in UserStats so the frontend can detect connectivity
      await prisma.userStats.upsert({
        where: { userId: user.id },
        update: updateData,
        create: {
          userId: user.id,
          totalHours: 0,
          totalSessions: 0,
          longestStreak: 0,
          currentStreak: 0,
          lastActiveDate: new Date(),
          monthlyData: typeof timezoneOffset === 'number' ? { timezoneOffset } : {},
        },
      })
      return NextResponse.json({ 
        success: true, 
        message: "Connection verified",
        userId: user.id,
      })
    }

    const now = new Date(timestamp || Date.now())
    // Use localDate from extension if available, otherwise compute from timezoneOffset, fallback to UTC
    let todayStr: string
    if (typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
      todayStr = localDate
    } else if (typeof timezoneOffset === 'number') {
      const localTime = new Date(now.getTime() - timezoneOffset * 60000)
      todayStr = localTime.toISOString().split('T')[0]
    } else {
      todayStr = now.toISOString().split('T')[0]
    }
    const today = new Date(todayStr)
    let startedNewSession = false

    // Check if there's a sessionBoundary flag (set on manual disconnect)
    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { monthlyData: true },
    })
    const monthlyData = (userStats?.monthlyData as Record<string, unknown>) || {}
    const hasSessionBoundary = !!monthlyData.sessionBoundary

    // Get or create today's contribution record
    const dailyContribution = await prisma.dailyContribution.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: user.id,
        date: today,
        hours: 0,
        sessions: 0,
        languages: [],
      },
    })

    // Get last heartbeat for this user to calculate time diff
    const lastActivity = await prisma.activity.findFirst({
      where: { userId: user.id },
      orderBy: { endTime: 'desc' },
    })

    const HEARTBEAT_INTERVAL = 30 // seconds - expected heartbeat interval
    
    let activityDuration = HEARTBEAT_INTERVAL // Default to one heartbeat interval
    
    if (lastActivity) {
      // Only start a new session if manually disconnected (sessionBoundary flag)
      if (hasSessionBoundary) {
        // Manual disconnect happened — start new session
        startedNewSession = true
        await prisma.activity.create({
          data: {
            userId: user.id,
            startTime: now,
            endTime: now,
            duration: HEARTBEAT_INTERVAL,
            language: language || 'unknown',
            fileType: file ? file.split('.').pop() : null,
            extensions: [],
            idleTime: isIdle ? HEARTBEAT_INTERVAL : 0,
            projectHash: body.projectHash || null,
            projectName: body.project || null,
            platform: body.platform || null,
          },
        })
        
        // Increment session count for today
        await prisma.dailyContribution.update({
          where: { id: dailyContribution.id },
          data: {
            sessions: { increment: 1 },
          },
        })

        // Clear the sessionBoundary flag
        await prisma.userStats.update({
          where: { userId: user.id },
          data: {
            monthlyData: { ...monthlyData, sessionBoundary: false, timezoneOffset: typeof timezoneOffset === 'number' ? timezoneOffset : monthlyData.timezoneOffset },
          },
        })
      } else {
        // Continue existing session — always extend regardless of time gap
        await prisma.activity.update({
          where: { id: lastActivity.id },
          data: {
            endTime: now,
            duration: lastActivity.duration + HEARTBEAT_INTERVAL,
            language: language || lastActivity.language,
            idleTime: isIdle ? lastActivity.idleTime + HEARTBEAT_INTERVAL : lastActivity.idleTime,
          },
        })
        activityDuration = HEARTBEAT_INTERVAL
      }
    } else {
      // First activity ever - create new session
      startedNewSession = true
      await prisma.activity.create({
        data: {
          userId: user.id,
          startTime: now,
          endTime: now,
          duration: HEARTBEAT_INTERVAL,
          language: language || 'unknown',
          fileType: file ? file.split('.').pop() : null,
          extensions: [],
          idleTime: isIdle ? HEARTBEAT_INTERVAL : 0,
          projectHash: body.projectHash || null,
          projectName: body.project || null,
          platform: body.platform || null,
        },
      })
      
      // Increment session count
      await prisma.dailyContribution.update({
        where: { id: dailyContribution.id },
        data: {
          sessions: { increment: 1 },
        },
      })
    }

    // Always update lastActiveDate so connection-status detects connectivity
    // even when the user is idle (VS Code is still open and sending heartbeats)
    const upsertMonthlyData = typeof timezoneOffset === 'number'
      ? { ...monthlyData, timezoneOffset, sessionBoundary: false }
      : { ...monthlyData, sessionBoundary: false }
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
        monthlyData: typeof timezoneOffset === 'number' ? { timezoneOffset } : {},
      },
    })

    // Update daily hours (only count non-idle time)
    if (!isIdle) {
      const hoursToAdd = activityDuration / 3600

      // Update hours and add language to today's languages list
      const existingLangs = (dailyContribution.languages as string[]) || []
      const updatedLangs = language && !existingLangs.includes(language)
        ? [...existingLangs, language]
        : existingLangs

      // Track project hash
      const projectHash = body.projectHash
      const existingProjects = (dailyContribution.projects as string[]) || []
      const updatedProjects = projectHash && !existingProjects.includes(projectHash)
        ? [...existingProjects, projectHash]
        : existingProjects

      await prisma.dailyContribution.update({
        where: { id: dailyContribution.id },
        data: {
          hours: { increment: hoursToAdd },
          languages: updatedLangs,
          projects: updatedProjects,
        },
      })

      // Increment total hours and update streak (lastActiveDate already updated above)
      await prisma.userStats.update({
        where: { userId: user.id },
        data: { totalHours: { increment: hoursToAdd } },
      })

      // Persist streak calculations so they survive disconnects
      if (startedNewSession) {
        try {
          const recentContribs = await prisma.dailyContribution.findMany({
            where: { userId: user.id, hours: { gt: 0 } },
            orderBy: { date: 'desc' },
            take: 365,
            select: { date: true },
          })
          const dates = recentContribs.map(c => new Date(c.date).toISOString().split('T')[0]).sort().reverse()
          if (dates.length > 0) {
            const streakYesterday = new Date(todayStr)
            streakYesterday.setDate(streakYesterday.getDate() - 1)
            const yesterdayStr = streakYesterday.toISOString().split('T')[0]
            let currentStreak = 0
            let checkDate = dates[0] === todayStr || dates[0] === yesterdayStr ? new Date(dates[0]) : null
            if (checkDate) {
              const dateSet = new Set(dates)
              while (dateSet.has(checkDate.toISOString().split('T')[0])) {
                currentStreak++
                checkDate.setDate(checkDate.getDate() - 1)
              }
            }
            let longestStreak = 1, streak = 1
            const allDates = [...dates].reverse()
            for (let i = 1; i < allDates.length; i++) {
              const diffDays = (new Date(allDates[i]).getTime() - new Date(allDates[i - 1]).getTime()) / 86400000
              streak = diffDays === 1 ? streak + 1 : 1
              longestStreak = Math.max(longestStreak, streak)
            }
            await prisma.userStats.update({
              where: { userId: user.id },
              data: {
                currentStreak,
                longestStreak: Math.max(longestStreak, currentStreak),
              },
            })
          }
        } catch { /* non-critical streak update */ }
      }

      // Persist per-language cumulative totals from extension map.
      if (Object.keys(languageBreakdown).length > 0) {
        await updateLanguageTotalsFromSnapshot(user.id, languageBreakdown)
      } else if (language && language !== 'unknown') {
        await incrementSingleLanguageFallback(user.id, language, HEARTBEAT_INTERVAL)
      }
    }

    // Store project hash → repoUrl mapping if provided
    if (body.repoUrl && body.projectHash) {
      try {
        const userStats = await prisma.userStats.findUnique({
          where: { userId: user.id },
          select: { monthlyData: true },
        })
        const monthlyData = (userStats?.monthlyData as Record<string, unknown>) || {}
        const projectRepos = (monthlyData.projectRepos as Record<string, string>) || {}
        if (!projectRepos[body.projectHash] || projectRepos[body.projectHash] !== body.repoUrl) {
          projectRepos[body.projectHash] = body.repoUrl
          await prisma.userStats.update({
            where: { userId: user.id },
            data: { monthlyData: { ...monthlyData, projectRepos } },
          })
        }
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ 
      success: true,
      message: "Heartbeat recorded" 
    })
  } catch (error) {
    console.error("Error processing heartbeat:", error)
    return NextResponse.json(
      { error: "Failed to process heartbeat" },
      { status: 500 }
    )
  }
}

function normalizeLanguageBreakdown(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  const normalized: Record<string, number> = {}
  Object.entries(value as Record<string, unknown>).forEach(([language, seconds]) => {
    const key = language.toLowerCase().trim()
    if (!key || key === 'unknown') return
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return
    normalized[key] = seconds
  })
  return normalized
}

async function updateLanguageTotalsFromSnapshot(userId: string, snapshot: Record<string, number>) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { topLanguages: true, monthlyData: true },
  })

  const monthlyData = (stats?.monthlyData as Record<string, unknown>) || {}
  const previousSnapshot = normalizeLanguageBreakdown(monthlyData.languageSnapshot)
  const totals = parseLanguageTotals(stats?.topLanguages)

  Object.entries(snapshot).forEach(([language, currentSeconds]) => {
    const previousSeconds = previousSnapshot[language] || 0
    const delta = currentSeconds - previousSeconds
    const secondsToAdd = delta >= 0 ? delta : currentSeconds
    if (secondsToAdd > 0) {
      totals[language] = (totals[language] || 0) + secondsToAdd
    }
  })

  await prisma.userStats.update({
    where: { userId },
    data: {
      topLanguages: totals,
      monthlyData: {
        ...monthlyData,
        languageSnapshot: snapshot,
      },
    },
  })
}

async function incrementSingleLanguageFallback(userId: string, language: string, secondsToAdd: number) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { topLanguages: true },
  })

  const totals = parseLanguageTotals(stats?.topLanguages)
  const key = language.toLowerCase()
  totals[key] = (totals[key] || 0) + secondsToAdd

  await prisma.userStats.update({
    where: { userId },
    data: { topLanguages: totals },
  })
}

function parseLanguageTotals(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  Object.entries(raw as Record<string, unknown>).forEach(([language, seconds]) => {
    if (typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0) {
      out[language.toLowerCase()] = seconds
    }
  })
  return out
}

// GET /api/heartbeat/status - Check if VS Code tracking is working
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required in x-api-key header" },
      { status: 401 }
    )
  }

  const user = await prisma.user.findFirst({
    where: { apiKey },
  })

  if (!user) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    )
  }

  const lastActivity = await prisma.activity.findFirst({
    where: { userId: user.id },
    orderBy: { endTime: 'desc' },
  })

  return NextResponse.json({
    connected: true,
    userId: user.id,
    lastActivityAt: lastActivity?.endTime || null,
  })
}
