# Claude Code Prompt — Final Output as Single `index.html`

**Goal**  
Generate a complete, production-ready **single HTML file** (`index.html`) for a **Rocket Telemetry System** landing page.  
Match the **modern dark gradient** aesthetic of the provided reference (rounded cards, neon-purple accents, clean UI preview).  
**All HTML, CSS (in `<style>`), and SVG must be embedded in this one file.** No external assets, no external JS libraries.

---

## Constraints

- Responsive (desktop-first, then tablet/mobile).
- Accessible (semantic HTML, skip link, keyboard focus styles, proper color contrast).
- Respect `prefers-reduced-motion`.
- Lightweight, performant (no heavy effects; use CSS only).
- **No comments** in the final HTML/CSS output.
- Use system fonts or include only safe fallbacks.

---

## Visual Language

- **Background:** Deep navy → dark purple radial/linear gradient with subtle vignette; faint starfield via CSS (tiny blurred dots).
- **Primary Accent:** Electric purple `#A855F7` (hover: slightly brighter).
- **Text:** White `#FFFFFF` (primary); soft gray `#D1D5DB` (secondary); muted `#9CA3AF` (meta).
- **Cards & Surfaces:** Very dark indigo with 8–16px radius; thin 1px translucent borders.
- **Typography:** `Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`.
- **Buttons:** Large, rounded; primary = filled purple; secondary = outline on dark.
- **Icons:** Outline style via inline SVG where needed.
- **Shadow/Glow:** Subtle purple outer glow for primary CTAs and rocket thruster.

---

## Page Structure

### 1) Header (sticky)

- Left: Minimal logo (circular rocket glyph SVG) + “Rocket Telemetry System”.
- Right nav: Product, Technology, Pricing, Docs, Contact.
- Auth actions: “Log in” (outline) and “Sign up” (filled purple).
- Sticky with backdrop blur effect on scroll; thin bottom divider line.

### 2) Hero

- Left column (text):
  - Big H1: “Monitor your rockets in real time”
  - Subhead: one concise sentence about live telemetry, predictive analytics, automated insights.
  - CTAs: “Get started” (primary) and “See how it works” (secondary).
- Right column (visual):
  - **Large inline SVG rocket illustration** with subtle animated details.
  - Small blinking telemetry dots and faint thruster pulse (CSS animation; disable via `prefers-reduced-motion`).
- Background starfield behind content, very subtle.

### 3) Key Benefits Strip

- Three or four compact cards with icon + short headline + one-line description.
- Examples (you generate copy): real-time streaming, anomaly alerts, predictive trajectory, API-first.

### 4) Feature Section (grid)

- Section title: “Powerful capabilities for mission success”
- Subtitle: one line about reliability and scale.
- **Important:** You must **author the complete feature list** (8–12 items).
  - Each item: small icon (inline SVG), concise title, 1–2 sentence description.
  - Aim for aerospace-relevant features (e.g., sensor fusion, event timelines, fault tree hints, REST/WebSocket APIs, role-based access, secured data retention, export, test-flight replay, SLA uptime, etc.).
- Use a responsive 2–3 column grid.

### 5) Live Dashboard Preview

- A wide, dark **mock dashboard card**: left sidebar (channels/streams), top toolbar, table of recent events, a small line chart and status chips.
- Pure HTML/CSS (no working JS).
- Include tiny “Overview / Sensors / Alerts” pseudo-tabs (style only).

### 6) LLM-Powered Assistant Banner

- Short blurb about mission log summarization, anomaly explanation, “what-if” natural-language queries.
- One CTA: “Request a Demo”.

### 7) FAQ

- 5–7 questions in disclosure `<details>` accordions.
- Example topics: data freshness, APIs, deployment, security, pricing model.

### 8) Footer

- Left: brief company text.
- Right: links (Docs, Status, Security, Terms, Privacy) + social icons (LinkedIn, GitHub, X) as inline SVG.
- Bottom line: copyright.

---

## Rocket SVG Requirements

- Modern, sleek vector rocket with labeled sections: Nose Cone, Payload Bay, Stage, Fuel Tank, Engine Nozzle, Fins.
- Gentle gradients on hull; neon-purple highlights.
- Small telemetry markers along the body (pulsing dots).
- Faint thruster glow; optional dotted measurement lines.

---

## Interactions & Motion

- Button hover: slight scale (1.02) and glow; respect `prefers-reduced-motion` to disable transforms.
- Focus: visible outline ring in purple/white.
- Sticky header backdrop blur appears after scroll.

---

## Deliverable

- Output a **single `index.html`** containing:
  - `<head>` with meta viewport, SEO title/description, social meta.
  - `<style>` with all CSS (variables for colors, spacing, radii; utility classes ok).
  - `<body>` with the full layout and inline SVGs.
- No external fonts or libraries. Everything must render standalone.

---

## Copy To Generate (you write it)

- Hero subheading (1–2 lines).
- Benefits (3–4).
- **Full feature list (8–12 items) with aerospace-credible wording.**
- FAQ (5–7).
- LLM banner one-liner.

---
