import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendGoalAchievedEmail(
  to: string,
  goalType: string,
  target: number,
  targetDate: string | null,
  userName: string | null
) {
  const goalTypeLabel =
    goalType === "daily_hours"
      ? `${target}h daily coding`
      : goalType === "weekly_hours"
        ? `${target}h weekly coding`
        : `${target}-day streak`

  const dateStr = targetDate
    ? new Date(targetDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "today"

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; color: white;">🎯 Goal Achieved!</h1>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 18px; margin-bottom: 8px;">Hey ${userName || "there"},</p>
        <p style="color: #a3a3a3; font-size: 16px; line-height: 1.6;">
          Congratulations! You've achieved your goal of <strong style="color: #60a5fa;">${goalTypeLabel}</strong> for <strong style="color: #60a5fa;">${dateStr}</strong>.
        </p>
        <div style="background: #1a1a2e; border: 1px solid #2563eb33; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #a3a3a3; margin: 0 0 8px;">Your Achievement</p>
          <p style="font-size: 32px; font-weight: bold; color: #60a5fa; margin: 0;">${goalTypeLabel}</p>
        </div>
        <p style="color: #737373; font-size: 14px;">Keep up the great work! Consistency is the key to mastery.</p>
      </div>
      <div style="padding: 16px 32px; background: #111; text-align: center; border-top: 1px solid #222;">
        <p style="color: #555; font-size: 12px; margin: 0;">VS Integrate — Track your coding journey</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from: `"VS Integrate" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎯 Goal Achieved: ${goalTypeLabel}!`,
    html,
  })
}
