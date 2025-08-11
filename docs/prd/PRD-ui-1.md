# Claude Code Prompt – Rocket Telemetry System Landing Page

**Task:**  
Create a **single HTML file** (`index.html`) that serves as the landing page for **Rocket Telemetry System**.  
The design must mimic the **blueprint / technical drawing** style from the provided reference image.  
All HTML, CSS, and SVG must be in one file — **no external dependencies**.  
No external JavaScript libraries allowed.

---

## Style & Visual Language

- **Colors:**
  - Background: White (#FFFFFF)
  - Primary lines & text: Blueprint blue (#2B50E6)
  - Guidelines: Light blue (#BFD0FF, 30% opacity)
  - Accents: Darker blueprint blue (#1939B7)
- **Typography:**
  - Monospace-inspired sans-serif: `IBM Plex Mono`, fallback to `ui-monospace, SFMono-Regular, Menlo, monospace`.
- **Lines:** Thin (1–1.25px) strokes, **dotted/dashed** for guidelines, isometric & exploded views, measurement labels.
- **Grid:** Subtle 8px base rhythm with dotted section dividers.
- **Icons:** Outline style (antenna, radar, chip, cloud, arrow).
- **Hover/Focus:** Slight stroke thickening or small color shift; no shadows.

---

## Layout Structure

### 1. Sticky Header

- Left: Large monospace title — **ROCKET TELEMETRY SYSTEM** (blue outline style).
- Right: Short tagline — _“Real-time monitoring & analysis for next-gen space missions”_.
- Below: dotted separator line.

---

### 2. Hero Section

- **Left:** Large inline SVG rocket drawing (see “Rocket SVG Requirements” below).
- **Right:**
  - Introductory text (2–3 paragraphs).
  - Two outline CTA buttons:
    - **Request Demo**
    - **Developer Docs**
- Background: faint isometric grid + dimension lines.

---

### 3. System Overview Diagram

- **Data Flow Diagram:** Rocket sensors → satellite uplink → ground station → telemetry data processor.
- **Sensor Placement Diagram:** Side view with labeled points for temperature, pressure, vibration, GPS.

---

### 4. Features Section

**Important:** In this section, list the features **properly and clearly** in a way that sells the system to aerospace engineers. Use **two formats**:

1. **Bulleted list** with short descriptions.
2. **Table format** with “Feature” and “Description” columns.

Leave enough space for Claude to create an informative and attractive feature block.

---

### 5. Q&A Section

Two-column table format:

| Question                               | Answer                              |
| -------------------------------------- | ----------------------------------- |
| How fast is the data updated?          | Real-time with 1-second refresh     |
| Is there an API?                       | Yes, REST and WebSocket supported   |
| Does it support trajectory prediction? | Yes, built-in algorithms            |
| Can it detect anomalies?               | Yes, with AI-driven fault detection |

---

### 6. Footer

- Centered text:  
  _Rocket Telemetry System – © 2025 OrbitalTech_
- Outline icons for email, GitHub, LinkedIn.

---

## Rocket SVG Requirements

- Blueprint-style contour drawing of a rocket.
- Labels for **Nose Cone**, **Payload Bay**, **Fuel Tank**, **Main Engine**.
- Exploded isometric view to reveal components.
- Dashed dimension lines & measurement annotations for authenticity.

---

**Output:** The result should be a complete `index.html` file with embedded CSS and SVG illustrations, ready to open in a browser.
