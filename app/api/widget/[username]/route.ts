import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/widget/[username] - Embeddable SVG widget
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findFirst({
      where: { username, profilePublic: true },
      select: { id: true, name: true, username: true },
    })

    if (!user) {
      return new Response(generateErrorSVG("User not found"), {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "max-age=300" },
      })
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: user.id },
    })

    // Get last 30 days of contributions for mini heatmap
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const contributions = await prisma.dailyContribution.findMany({
      where: {
        userId: user.id,
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "asc" },
    })

    const contribMap: Record<string, number> = {}
    contributions.forEach(c => {
      contribMap[new Date(c.date).toISOString().split("T")[0]] = c.hours
    })

    // Get top language
    const topLangs = (stats?.topLanguages as any[]) || []
    const topLanguage = topLangs.length > 0 ? topLangs[0].language : "–"

    const totalHours = parseFloat((stats?.totalHours || 0).toFixed(1))
    const currentStreak = stats?.currentStreak || 0

    const svg = generateWidgetSVG({
      username: user.username || user.name || username,
      totalHours,
      currentStreak,
      topLanguage,
      last30Days: contribMap,
    })

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    })
  } catch (error) {
    console.error("Error generating widget:", error)
    return new Response(generateErrorSVG("Error generating widget"), {
      headers: { "Content-Type": "image/svg+xml" },
    })
  }
}

function generateWidgetSVG(data: {
  username: string
  totalHours: number
  currentStreak: number
  topLanguage: string
  last30Days: Record<string, number>
}): string {
  // Generate mini heatmap for last 30 days
  const heatmapCells: string[] = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const hours = data.last30Days[dateStr] || 0
    const color = getHeatmapColor(hours)
    const col = 29 - i
    const x = 25 + col * 15
    const y = 130
    heatmapCells.push(`<rect x="${x}" y="${y}" width="12" height="12" rx="2" fill="${color}" />`)
  }

  return `<svg width="495" height="195" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1e3a5f;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d1117;stop-opacity:1" />
    </linearGradient>
  </defs>
  <style>
    .card { fill: #0d1117; }
    .title { fill: #e6edf3; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 15px; font-weight: 600; }
    .stat { fill: #58a6ff; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 22px; font-weight: 700; }
    .label { fill: #8b949e; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11px; }
    .footer { fill: #484f58; font-family: 'Segoe UI', system-ui, sans-serif; font-size: 10px; }
  </style>

  <rect class="card" width="495" height="195" rx="10" stroke="#30363d" stroke-width="1" />

  <!-- Header -->
  <text x="25" y="35" class="title">⌨️ ${escapeXml(data.username)}'s Coding Activity</text>

  <!-- Stats row -->
  <text x="25" y="78" class="stat">${data.totalHours}h</text>
  <text x="25" y="98" class="label">Total This Year</text>

  <text x="180" y="78" class="stat">${data.currentStreak}</text>
  <text x="180" y="98" class="label">Day Streak 🔥</text>

  <text x="320" y="78" class="stat">${escapeXml(data.topLanguage)}</text>
  <text x="320" y="98" class="label">Top Language</text>

  <!-- Mini heatmap label -->
  <text x="25" y="122" class="label">Last 30 days</text>

  <!-- Mini heatmap -->
  ${heatmapCells.join("\n  ")}

  <!-- Footer -->
  <text x="25" y="180" class="footer">vs-integrate · vsintegrate.com/u/${escapeXml(data.username)}</text>
</svg>`
}

function generateErrorSVG(message: string): string {
  return `<svg width="495" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="100" rx="10" fill="#0d1117" stroke="#30363d" stroke-width="1" />
  <text x="247" y="55" text-anchor="middle" fill="#8b949e" font-family="system-ui" font-size="14">${escapeXml(message)}</text>
</svg>`
}

function getHeatmapColor(hours: number): string {
  if (!hours || hours === 0) return "#161b22"
  if (hours < 1) return "#0e4429"
  if (hours < 2) return "#006d32"
  if (hours < 4) return "#26a641"
  return "#39d353"
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
