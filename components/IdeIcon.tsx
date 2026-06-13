import { Code2, Cuboid, FileCode2, Keyboard, TerminalSquare } from "lucide-react"
import { IDE_CONFIG, type IdeId } from "@/lib/ide-config"

type Props = {
  ide: IdeId
  className?: string
}

export default function IdeIcon({ ide, className = "size-5" }: Props) {
  const color = IDE_CONFIG[ide].color
  const Icon = ide === "jetbrains"
    ? Cuboid
    : ide === "zed"
      ? Keyboard
      : ide === "neovim"
        ? TerminalSquare
        : ide === "sublime"
          ? FileCode2
          : Code2

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm border border-border bg-card ${className}`}
      style={{ color }}
      aria-hidden="true"
    >
      <Icon className="size-[70%]" strokeWidth={2.2} />
    </span>
  )
}
