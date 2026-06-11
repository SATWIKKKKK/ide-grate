# Design - VS-Integrate Signal Studio

A locked design system for this app. Every page redesign reads this file before emitting code. Do not regenerate per page; extend this file when the system needs to grow.

## Genre
modern-minimal product workbench

## Macrostructure Family
- Marketing pages: Signal Ledger, with an immediate product preview, proof-by-interface sections, privacy proof, setup flow, and a concise CTA.
- App pages: Product Workbench, with dense but calm panels, left-to-right scan paths, status-first headers, and compact data controls.
- Content/profile pages: Public Signal Sheet, with identity first, metrics second, and share/embed controls last.

## Theme
- `--color-paper` oklch(97.8% 0.012 92)
- `--color-paper-2` oklch(94.8% 0.017 92)
- `--color-paper-3` oklch(90.2% 0.021 92)
- `--color-ink` oklch(17% 0.018 245)
- `--color-ink-2` oklch(36% 0.020 245)
- `--color-muted` oklch(54% 0.018 245)
- `--color-rule` oklch(82% 0.020 92)
- `--color-accent` oklch(49% 0.155 154)
- `--color-accent-2` oklch(58% 0.145 214)
- `--color-warn` oklch(68% 0.145 74)
- `--color-danger` oklch(56% 0.18 28)
- `--color-focus` oklch(56% 0.18 214)

## Typography
- Display: Newsreader, weight 400, normal/italic.
- Body: Geist, weight 400-650.
- Mono: Geist Mono, weight 400-600.
- Display tracking: 0.
- Type scale anchor: `--text-display = clamp(3rem, 7vw, 6.75rem)`.

## Spacing
4-point named scale. Pages use named tokens or Tailwind values derived from the system rhythm.

## Motion
- GSAP: page reveals, staggered surface entry, heatmap/chart arrival, and metric count-ups.
- Framer Motion: retained for menus, modals, and local state transitions.
- Reduced motion: no spatial movement; opacity changes are <= 150 ms.

## Microinteractions
- Success is quiet and local.
- Focus rings are instant and visible.
- Hover states use border, color, and transform only.
- Destructive actions require explicit confirmation.

## CTA Voice
- Primary: compact dark/green filled controls with icon + concise verb.
- Secondary: inset paper controls with one-pixel rule.
- Icon-only buttons require accessible labels.

## What Pages Must Share
- Signal Studio palette and token names.
- Geist + Newsreader + Geist Mono roles.
- 8px-or-less default radius on cards/panels except round avatars and switches.
- The same nav, focus, forms, chart surfaces, and modal tone.
- GSAP motion rules with reduced-motion support.

## What Pages May Differ On
- Marketing pages may use a larger hero and product-signal preview.
- App pages prioritize compact data density and avoid decorative hero layouts.
- Public profile pages may be quieter and more share-card-like.

## Exports

### tokens.css
See `tokens.css` at the project root. It is the canonical CSS export.

### Tailwind v4 `@theme`
See `app/globals.css` for the in-app Tailwind mapping.

