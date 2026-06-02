---
name: Financial Precision System - Dark
colors:
  surface: '#111318'
  surface-dim: '#111318'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c2c6d8'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8c90a1'
  outline-variant: '#424655'
  surface-tint: '#b3c5ff'
  primary: '#b3c5ff'
  on-primary: '#002b75'
  primary-container: '#5e8bff'
  on-primary-container: '#002567'
  inverse-primary: '#0055d5'
  secondary: '#a6e6ff'
  on-secondary: '#003543'
  secondary-container: '#14d1ff'
  on-secondary-container: '#00566b'
  tertiary: '#ffb596'
  on-tertiary: '#581e00'
  tertiary-container: '#ef671e'
  on-tertiary-container: '#4d1900'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae1ff'
  primary-fixed-dim: '#b3c5ff'
  on-primary-fixed: '#001849'
  on-primary-fixed-variant: '#003fa4'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#111318'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

This design system is engineered for high-stakes financial environments where clarity, speed of data ingestion, and professional authority are paramount. The aesthetic follows a **Corporate / Modern** direction with a focus on data density and visual hierarchy.

The brand personality is analytical, secure, and precise. It avoids unnecessary decoration, opting instead for a "dashboard-first" philosophy. The UI should evoke a sense of calm control, using deep oceanic tones to reduce eye strain during long-term monitoring, while employing vibrant accents to draw immediate attention to critical financial signals.

## Colors

The palette is anchored by a deep charcoal-navy (`#0a0c10`) which serves as the base canvas. 

- **Primary:** A vibrant "Electric Blue" used for primary actions and active states, providing high legibility against the dark background.
- **Secondary:** A cyan-leaning blue used for secondary data points or progress indicators.
- **Neutrals:** Text scales from pure white (`#FFFFFF`) for headers to a muted grey-blue (`#94A3B8`) for secondary information.
- **Semantic Colors:** Success, error, and warning tokens are optimized for dark mode saturation levels to ensure they "pop" without creating visual vibrations.

## Typography

This system utilizes **Hanken Grotesk** for its exceptional legibility in data-heavy interfaces. It balances a modern, clean geometry with technical precision.

- **Headlines:** Use tighter letter spacing and semi-bold/bold weights to establish a clear information hierarchy.
- **Data Display:** For financial figures and ticker symbols, an optional monospaced secondary font (JetBrains Mono) is introduced to ensure tabular alignment of currency values.
- **Labels:** Small labels use uppercase with slight tracking to ensure they are distinguishable from body text at 12px.

## Layout & Spacing

The layout utilizes a **12-column fixed grid** for desktop, centered within the viewport. Spacing follows a strict 4px/8px incremental scale to maintain mathematical harmony.

- **Desktop:** 12 columns, 24px gutters, 40px minimum side margins.
- **Tablet:** 8 columns, 16px gutters, 24px side margins.
- **Mobile:** 4 columns, 16px gutters, 16px side margins.

Content is grouped into "Data Blocks" (cards), which use the `md` (16px) spacing for internal padding to maximize information density without feeling cluttered.

## Elevation & Depth

In this dark mode environment, depth is communicated through **Tonal Layering** rather than heavy shadows.

1. **Level 0 (Base):** `#0a0c10` - The main application background.
2. **Level 1 (Surface):** `#151921` - Used for primary cards, sidebars, and navigation headers.
3. **Level 2 (Elevated):** `#1C222C` - Used for modals, dropdown menus, and hover states on cards.

Subtle, low-opacity borders (`rgba(255, 255, 255, 0.08)`) are applied to all surfaces to define edges where tonal differences are minimal. Shadows, when used (e.g., for floating modals), are large and diffused with a dark navy tint: `0 12px 24px rgba(0, 0, 0, 0.5)`.

## Shapes

The system follows the **ROUND_EIGHT** principle. The primary radius is **0.5rem (8px)**, which provides a professional yet accessible feel that softens the "technical" nature of financial data.

- **Small Components:** Checkboxes and small tags use 4px (Soft).
- **Standard Components:** Buttons, Input fields, and Cards use 8px (Rounded).
- **Large Components:** Modals and feature banners use 16px (Rounded-LG).

## Components

- **Buttons:** Primary buttons are solid vibrant blue (`#2970FF`) with white text. Secondary buttons use a subtle ghost style with a 1px border.
- **Inputs:** Darker than the container (`#0a0c10`) with a 1px border that glows primary blue on focus.
- **Chips/Status:** High-contrast background tints with bold colored text (e.g., Success: dark green background with light green text).
- **Data Tables:** Row-based with subtle dividers. Header rows use `label-md` typography. Zebra striping is avoided in favor of subtle hover highlights.
- **Cards:** No background shadows; defined by surface color and a subtle inner stroke.
- **Charts:** Use a custom-tuned palette of secondary blues, teals, and purples that maintain high contrast against the Level 1 surface.