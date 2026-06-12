# Design - Monochrome Logic

A locked design system for vs-integrate. Every page uses this system for typography, colour, spacing, borders, forms, charts, and navigation. Backend data remains dynamic; reference numbers in mockups are presentation examples only.

## Genre
High-contrast minimal developer workbench.

## Brand & Style
The interface is disciplined, technical, and premium. It uses generous whitespace, precise one-pixel rules, compact controls, and editorial serif headlines. The UI should feel like a quiet technical journal layered over a blueprint grid, not a generic SaaS dashboard.

## Colors
- Surface: `#f9f9fa`
- Surface low: `#f3f3f4`
- Surface container: `#eeeeef`
- Surface high: `#e8e8e9`
- Surface highest: `#e2e2e3`
- Surface lowest: `#ffffff`
- Ink: `#1a1c1d`
- Ink muted: `#4c4546`
- Secondary: `#5d5f5f`
- Outline: `#7e7576`
- Outline variant: `#cfc4c5`
- Primary: `#000000`
- Inverse surface: `#2f3132`
- Inverse text: `#f0f1f2`
- Error: `#ba1a1a`
- Live/success utility: `#16a34a`

Colour is achromatic by default. Green is reserved for live status, contribution density, and success utility states.

## Typography
- Display: Libre Caslon Text, weight 400.
- Body/UI: Hanken Grotesk, weights 400 and 600.
- Metadata/code: JetBrains Mono, weights 400 and 500.
- Display large: 48px desktop, 32px mobile, line-height 1.1-1.2.
- Headline: 24-40px serif, line-height 1.15-1.3.
- Body large: 18px, line-height 1.6.
- Body: 15px, line-height 1.5.
- Labels: 12px JetBrains Mono, uppercase or compact metadata.

## Layout & Spacing
- 4px base rhythm.
- Desktop content max width: 1200px.
- Desktop side margin: 64px where space allows.
- Mobile side margin: 16px.
- Major vertical sections use 48px to 96px breathing room.
- Dashboard/app pages use dense but calm workbench panels.
- All main page backgrounds use a subtle blueprint grid at 40px or 64px.

## Elevation & Depth
No soft SaaS shadow stack. Depth comes from tonal surfaces, borders, and occasional very restrained panel shadow. Components use 1px borders, darker borders on hover/focus, and instant 100ms interactions.

## Shapes
- Base radius: 4px.
- Large cards and panels: 8px.
- Pills only for status indicators, avatars, and toggles.
- Icons use lucide thin-stroke icons.

## Components
- Primary buttons: black fill, white text.
- Secondary buttons: white/paper fill, black or outline border.
- Ghost buttons: transparent until hover.
- Inputs: white fill, outline-variant border, mono labels, black focus border and sharp ring.
- Cards: 1px border, 24px padding, 8px radius.
- Dashboard cards: serif section titles, mono metadata, grayscale charts.
- Chips: small JetBrains Mono labels with border or light gray fill.
- Toggles: black when on, gray when off.

## Page Coverage
- Landing: nav, product hero, signal preview, feature cards, privacy cards, final CTA, footer.
- Auth: split dark editorial value panel plus transactional form card with trust chips.
- Setup: three-step workbench for install, API key connection, and verification.
- Dashboard: overview session, stats, API key banner, analytics trend/mix, projects/languages, goals, achievements, rewards.
- Settings: profile/stats, profile edit form, privacy, notifications, telemetry export/purge, sign out.
- Public profile: same monochrome sheet principles using live profile data.
