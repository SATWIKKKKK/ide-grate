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
    } = body

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
      // Update lastActiveDate in UserStats so the frontend can detect connectivity
      await prisma.userStats.upsert({
        where: { userId: user.id },
        update: { lastActiveDate: new Date() },
        create: {
          userId: user.id,
          totalHours: 0,
          totalSessions: 0,
          longestStreak: 0,
          currentStreak: 0,
          lastActiveDate: new Date(),
        },
      })
      return NextResponse.json({ 
        success: true, 
        message: "Connection verified",
        userId: user.id,
      })
    }

    const now = new Date(timestamp || Date.now())
    const today = new Date(now.toISOString().split('T')[0])

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
    const SESSION_TIMEOUT = 120 // seconds - gap before starting new session
    
    let activityDuration = HEARTBEAT_INTERVAL // Default to one heartbeat interval
    
    if (lastActivity) {
      const timeSinceLastActivity = (now.getTime() - lastActivity.endTime.getTime()) / 1000
      
      if (timeSinceLastActivity <= SESSION_TIMEOUT) {
        // Continue existing session - update end time
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
      } else {
        // Start new session
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
          },
        })
        
        // Increment session count for today
        await prisma.dailyContribution.update({
          where: { id: dailyContribution.id },
          data: {
            sessions: { increment: 1 },
          },
        })
      }
    } else {
      // First activity ever - create new session
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

    // Update daily hours (only count non-idle time)
    if (!isIdle) {
      const hoursToAdd = activityDuration / 3600
      await prisma.dailyContribution.update({
        where: { id: dailyContribution.id },
        data: {
          hours: { increment: hoursToAdd },
        },
      })

      // Update user stats
      await prisma.userStats.upsert({
        where: { userId: user.id },
        update: {
          totalHours: { increment: hoursToAdd },
          lastActiveDate: now,
        },
        create: {
          userId: user.id,
          totalHours: hoursToAdd,
          totalSessions: 1,
          lastActiveDate: now,
          longestStreak: 1,
          currentStreak: 1,
        },
      })
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
