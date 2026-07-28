# Design System & Aesthetic Guidelines: Dersha

> **Impeccable Design Standard**: Eliminate generic boilerplate, weak contrast, arbitrary pixel offsets, and uninspired layouts. Every UI element must feel intentional, responsive, and visually harmonious.

---

## 🎨 Color Palette & Tokens

### Dark Mode (Primary Default)
- `--bg-base`: `hsl(224, 25%, 6%)` (Deep slate night)
- `--bg-surface`: `hsl(222, 20%, 10%)` (Elevated surface)
- `--bg-overlay`: `hsl(220, 18%, 15%)` (Card / modal background)
- `--border-subtle`: `hsl(220, 14%, 18%)`
- `--border-strong`: `hsl(220, 16%, 28%)`

### Accents & Indicators
- `--accent-primary`: `hsl(250, 84%, 67%)` (Electric Indigo)
- `--accent-hover`: `hsl(250, 84%, 74%)`
- `--accent-subtle`: `hsla(250, 84%, 67%, 0.12)`
- `--text-primary`: `hsl(210, 40%, 98%)` (High-contrast pure white)
- `--text-secondary`: `hsl(215, 20%, 65%)` (Muted silver)
- `--text-tertiary`: `hsl(215, 16%, 45%)` (Subtle caption)

### Semantic Colors
- `--success`: `hsl(150, 75%, 42%)`
- `--warning`: `hsl(38, 92%, 50%)`
- `--error`: `hsl(354, 84%, 57%)`
- `--info`: `hsl(199, 89%, 48%)`

---

## 📐 Typography & Hierarchy

### Font Families
- **Sans-Serif**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **Monospace**: `JetBrains Mono`, `Fira Code`, `Consolas`, `monospace`

### Type Scale
| Token | Font Size | Line Height | Tracking | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `text-display` | `2.75rem` (44px) | `1.1` | `-0.03em` | `800` | Hero headings |
| `text-h1` | `2.00rem` (32px) | `1.2` | `-0.025em` | `700` | Page titles |
| `text-h2` | `1.50rem` (24px) | `1.25` | `-0.02em` | `600` | Section headers |
| `text-h3` | `1.25rem` (20px) | `1.3` | `-0.015em` | `600` | Card titles |
| `text-body` | `1.00rem` (16px) | `1.5` | `normal` | `400` | Paragraph text |
| `text-small` | `0.875rem` (14px)| `1.4` | `normal` | `400` | Labels, captions |
| `text-tiny` | `0.75rem` (12px) | `1.3` | `0.02em` | `500` | Badges, metadata |

---

## 📦 Spacing & Grid System

- **Base Unit**: 4px grid (`0.25rem`)
- **Scale**: `4px (0.25rem)`, `8px (0.5rem)`, `12px (0.75rem)`, `16px (1rem)`, `24px (1.5rem)`, `32px (2rem)`, `48px (3rem)`, `64px (4rem)`
- **Container Max Widths**:
  - Compact: `640px`
  - Content: `800px`
  - Standard: `1200px`
  - Wide: `1440px`

---

## ✨ Elevation, Glassmorphism & Shadows

```css
/* Surface Elevation Tokens */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.25);
--glass-bg: rgba(18, 22, 33, 0.75);
--glass-border: rgba(255, 255, 255, 0.08);
--glass-backdrop: blur(12px) saturate(180%);
```

---

## ⚡ Motion & Transitions

- **Fast (Hover & Micro-interactions)**: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- **Standard (Modals, Dropdowns)**: `250ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Complex Page Motion**: `350ms cubic-bezier(0.16, 1, 0.3, 1)`

---

## 🚫 AI Slop Checklist (Anti-Patterns to Avoid)
- [ ] **Generic Centered Hero**: Avoid text centered in a massive void with no visual anchor or interactive preview.
- [ ] **Floating Cards Without Hierarchy**: Do not wrap every single item in identical bordered cards with standard 1px borders.
- [ ] **Unfocused Gradients**: Avoid giant purple-to-pink background blobs that distract from content readability.
- [ ] **Low-Contrast Text**: Ensure all secondary text passes WCAG AA contrast (minimum 4.5:1 ratio).
- [ ] **Missing Interactive Feedback**: Every button and link must have clear hover, active, and keyboard `:focus-visible` outlines.
