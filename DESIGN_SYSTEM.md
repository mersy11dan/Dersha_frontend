# DERSHA Design System

This document defines the visual standards for `dersha_frontend`. Use it when porting pages from `dirshaWebClient` to React.

Installed skills (from [skills.sh](https://www.skills.sh/)):
- `web-design-guidelines` - accessibility, focus states, forms, motion
- `design-taste-frontend` - premium fintech aesthetic, anti-slop patterns

## Design read

Trust-first fintech onboarding for Ethiopian investors. Dark emerald theme, restrained motion, institutional polish.

**Dials:** Variance 5 · Motion 4 · Density 5

## Color palette

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-primary` | `#059669` | Primary buttons, active steps, links |
| `--brand-primary-hover` | `#047857` | Button hover |
| `--brand-primary-light` | `#68dba9` | Brand text, accents |
| `--brand-accent` | `#4edea3` | Success states, highlights |
| `--surface-base` | `#0a0f0c` | Page background |
| `--surface-overlay` | `#171d19` | Input backgrounds |
| `--surface-elevated` | `#1b211d` | Cards, panels |
| `--text-primary` | `#f0f4f2` | Headings, body |
| `--text-secondary` | `#bccac0` | Subtext |
| `--text-muted` | `#87948b` | Labels, placeholders |
| `--text-on-brand` | `#ffffff` | Text on primary buttons |

## Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 32-48px | 700 | Page titles |
| Headline | 24px | 600 | Section titles |
| Body | 16px | 400 | Paragraphs |
| Body large | 18px | 400 | Emphasized body |
| Label / Eyebrow | 12px | 600 | Form labels, caps text |

Font: **Inter** (400, 600, 700, 800)

Use `.dersha-heading` (text-wrap: balance) and `.dersha-subheading` (text-wrap: pretty) on titles.

## Spacing & radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 0.5rem |
| `--radius-md` | 0.75rem |
| `--radius-lg` | 1rem |
| `--radius-xl` | 1.25rem |
| `--radius-pill` | 9999px |

**Rule:** Buttons and inputs use `--radius-lg`. Login page uses `--radius-pill` for inputs and CTAs. Cards use `--radius-xl`.

## Component classes

All classes live in `src/styles/design-system.css`.

| Class | Purpose |
|-------|---------|
| `.page-shell` | Full-page wrapper with dark background |
| `.page-atmosphere` | Subtle gradient background glow |
| `.page-content` | Content layer above atmosphere |
| `.dersha-card` | Standard glass card |
| `.dersha-card-elevated` | Onboarding glass card |
| `.dersha-header` | Fixed top navigation bar |
| `.dersha-brand` | Brand name styling |
| `.dersha-brand-logo` | Header logo image (`/logo.svg`) |
| `.dersha-heading` | Page/section title |
| `.dersha-subheading` | Supporting text |
| `.dersha-eyebrow` | Uppercase label text |
| `.dersha-label` | Form field label |
| `.dersha-input` | Text input / select |
| `.dersha-input-pill` | Pill-shaped input (login) |
| `.dersha-btn` | Base button |
| `.dersha-btn-primary` | Primary CTA |
| `.dersha-btn-ghost` | Outline / social buttons |
| `.dersha-btn-pill` | Pill-shaped button |
| `.dersha-link` | Text link |
| `.dersha-step-track` | Progress step container |
| `.dersha-step-dot-active` | Current step |
| `.dersha-step-dot-complete` | Completed step |
| `.dersha-step-dot-pending` | Upcoming step |
| `.dersha-select-card` | Funding type selector |
| `.dersha-select-card-active` | Selected funding type |
| `.dersha-info-box` | Warning / info alert |
| `.dersha-trust-box` | Security notice box |
| `.dersha-divider` | "Or continue with" divider |
| `.dersha-animate-in` | Subtle fade-up entry |

## Porting checklist (dirshaWebClient → React)

When converting a new HTML page:

1. Keep the same layout, copy, and user flow from the HTML sample.
2. Wrap the page in `.page-shell` and add `.page-atmosphere` if the HTML had background glows.
3. Replace raw Tailwind card styles with `.dersha-card` or `.dersha-card-elevated`.
4. Replace form inputs with `.dersha-input` (add `.dersha-input-pill` only on login-style pages).
5. Replace primary buttons/links with `.dersha-btn .dersha-btn-primary`.
6. Replace `#059669` hardcoded colors with design tokens (already mapped to `--brand-primary` in Tailwind as `primary`).
7. Add `aria-label` on icon-only buttons and `aria-hidden="true"` on decorative icons.
8. Use `…` not `...` in placeholders and loading text.
9. Honor `prefers-reduced-motion` (handled globally in design-system.css).
10. Run `npm run build` to verify.

## What to change vs. keep

**Keep from HTML:**
- Page structure and sections
- Copy and labels
- Step flow and navigation paths
- Feature behavior (toggles, formatting, selection)

**Apply from design system:**
- Unified emerald primary (`#059669`)
- Glass card styling with inner highlight
- Consistent input focus rings
- Shared header and step tracker styles
- Subtle entry animations
- Accessibility improvements from web-design-guidelines

## File locations

```
src/styles/design-system.css   ← tokens + component classes
src/index.css                  ← Tailwind theme + imports design-system
.agents/skills/                ← installed Cursor skills
```
