import {
  siCursor,
  siGoogle,
  siJetbrains,
  siNeovim,
  siSublimetext,
  siZedindustries,
} from "simple-icons"
import { IDE_CONFIG, type IdeId } from "@/lib/ide-config"

type Props = {
  ide: IdeId
  className?: string
  bare?: boolean
}

type IconDef = {
  title: string
  path: string
  viewBox?: string
  hex?: string
}

const vscodeIcon: IconDef = {
  title: "Visual Studio Code",
  hex: "007ACC",
  viewBox: "0 0 24 24",
  path:
    "M23.15 2.587 18.21.21a1.494 1.494 0 0 0-1.705.29L7.06 9.122 2.947 6.002a.994.994 0 0 0-1.27.057L.327 7.291a1 1 0 0 0-.002 1.476L3.899 12 .325 15.233a1 1 0 0 0 .002 1.476l1.35 1.232a.994.994 0 0 0 1.27.057l4.113-3.12 9.444 8.622a1.494 1.494 0 0 0 1.705.29l4.94-2.377A1.5 1.5 0 0 0 24 20.06V3.94a1.5 1.5 0 0 0-.85-1.353ZM18 16.93 10.838 12 18 7.07v9.86Z",
}

const iconMap: Record<IdeId, IconDef> = {
  vscode: vscodeIcon,
  cursor: siCursor,
  antigravity: { ...siGoogle, title: "Google Antigravity" },
  jetbrains: siJetbrains,
  zed: siZedindustries,
  neovim: siNeovim,
  sublime: siSublimetext,
}

const pngIconMap: Partial<Record<IdeId, string | { light: string; dark: string }>> = {
  vscode: "/vscode.png",
  cursor: {
    light: "/cursor-darkmode.png",
    dark: "/cursor-darkmode.png",
  },
  antigravity: "/antigravity.png",
  jetbrains: "/jetbrains.png",
}

function PngIcon({ src, className, title }: { src: string | { light: string; dark: string }; className: string; title: string }) {
  if (typeof src === "string") {
    return <img src={src} alt={title} className={`${className} object-contain`} draggable={false} />
  }

  return (
    <>
      <img src={src.light} alt={title} className={`${className} object-contain dark:hidden`} draggable={false} />
      <img src={src.dark} alt={title} className={`${className} hidden object-contain dark:block`} draggable={false} />
    </>
  )
}

export default function IdeIcon({ ide, className = "size-5", bare = false }: Props) {
  const config = IDE_CONFIG[ide]
  const icon = iconMap[ide]
  const color = icon.hex ? `#${icon.hex.replace(/^#/, "")}` : config.color
  const pngIcon = pngIconMap[ide]

  if (bare) {
    if (pngIcon) {
      return <PngIcon src={pngIcon} className={className} title={icon.title} />
    }

    return (
      <svg
        viewBox={icon.viewBox || "0 0 24 24"}
        className={className}
        role="img"
        focusable="false"
        aria-label={icon.title}
      >
        <path fill={color} d={icon.path} />
      </svg>
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm border border-border bg-card ${className}`}
      title={icon.title}
      aria-hidden="true"
    >
      {pngIcon ? (
        <PngIcon src={pngIcon} className="size-[78%]" title={icon.title} />
      ) : (
        <svg
          viewBox={icon.viewBox || "0 0 24 24"}
          className="size-[72%]"
          role="img"
          focusable="false"
          aria-label={icon.title}
        >
          <path fill={color} d={icon.path} />
        </svg>
      )}
    </span>
  )
}
