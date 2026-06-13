import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Cadence public profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const displayName = username

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f9f9fa",
          color: "#1a1c1d",
          padding: 64,
          fontFamily: "Arial",
          border: "16px solid #111111",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
          <div style={{ display: "flex", fontWeight: 700 }}>Cadence</div>
          <div style={{ display: "flex", color: "#5d5f5f" }}>{`@${username}`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 82, lineHeight: 1, fontWeight: 700 }}>{displayName}</div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 30, color: "#4c4546", maxWidth: 880 }}>
            Real coding activity across the editor stack.
          </div>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 30 }}>
          <div style={{ display: "flex", border: "2px solid #cfc4c5", padding: "20px 28px", background: "#ffffff" }}>Public profile</div>
          <div style={{ display: "flex", border: "2px solid #cfc4c5", padding: "20px 28px", background: "#ffffff" }}>Multi-IDE activity</div>
        </div>
      </div>
    ),
    size
  )
}
