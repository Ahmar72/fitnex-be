# Fitnex — Design System & Visual Guidelines (DESIGN.md)

**Brand Name:** Fitnex  
**Core Aesthetic:** Performance High-Energy Modern Athletic Dark Mode with Warm Neon Orange Accents

---

## 1. Color Palette & Design Tokens

### 1.1 Primary Brand Accents
| Token | Hex | Role | Usage |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `#ff5e1a` | Brand Neon Flame | Primary action buttons, active tab indicators, flame badges, highlights. |
| `--color-primary-hover` | `#e04f12` | Hover State | Button hover and active press states. |
| `--color-primary-subtle` | `rgba(255, 94, 26, 0.12)` | Tinted Background | Active card badges, pill chips, selected state backgrounds. |

### 1.2 Neutral Dark Surface Tokens
| Token | Hex | Role | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#08090d` | Deep Void | Root application body background. |
| `--bg-surface` | `#11131a` | Card Surface | Workout cards, modal dialogs, exercise cards, dropdowns. |
| `--bg-surface-elevated` | `#181b24` | Elevated Surface | Hovered cards, search inputs, active selection tiles. |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Boundary Dividers | Card borders, table dividers, navbar border. |

### 1.3 Form & Input High-Contrast Standard
To prevent accessibility and visibility issues:
- **Input Container:** Crisp light slate background `#f8fafc` or deep elevated surface with high-contrast borders.
- **Input Text:** Deep slate `#0f172a` for light inputs, or crisp white `#ffffff` for dark inputs.
- **Verification / OTP Inputs:** 6 individual high-contrast character boxes with center-aligned, bold digits. Never display OTP in placeholder fields.

---

## 2. Typography

- **Display & Headings:** `Syne` / `Clash Display` / `system-ui` (Bold, uppercase tracking `+0.05em`).
- **Body & UI Text:** `Inter` / `Plus Jakarta Sans` / `system-ui` (Crisp readability at 14px-16px).
- **Digital Timers & Numerical Metrics:** Monospaced tabular numerals (`font-variant-numeric: tabular-nums`).

---

## 3. Component Design Guidelines

### 3.1 Buttons
- **Primary Action:** Solid `#ff5e1a` background, white bold text, rounded-xl padding, subtle orange drop shadow on hover.
- **Secondary Action:** Glassmorphic background `rgba(255, 255, 255, 0.06)` with subtle border `rgba(255, 255, 255, 0.15)`.
- **Destructive Action:** Deep crimson `#ef4444` with subtle tint background.

### 3.2 Modals & Dialogs
- Backdrop: Blurred dark overlay (`backdrop-filter: blur(12px)`, background `rgba(0, 0, 0, 0.75)`).
- Card Container: Rounded-2xl with subtle border glow and smooth Framer Motion entry animations.
