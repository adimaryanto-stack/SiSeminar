---
name: SiSeminar Professional System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#444651'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#3e2400'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c3800'
  on-tertiary-container: '#ef9900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-bg: '#F8FAFC'
  border-subtle: '#E2E8F0'
  admin-blue-dark: '#172554'
  teal-accent: '#14B8A6'
  destructive-red: '#EF4444'
  success-green: '#10B981'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1280px
---

## Brand & Style
The brand personality is **authoritative, efficient, and reliable**. Designed for the high-stakes environment of seminar management, the UI prioritizes data clarity for administrators while maintaining a welcoming, accessible atmosphere for participants. 

The design follows a **Corporate / Modern** aesthetic with a strong emphasis on **Functional Minimalism**. It avoids decorative flourishes in favor of structured information hierarchy. The interface should feel like a high-end productivity tool: precise, fast, and trustworthy. We achieve this through generous whitespace, a rigid grid system, and subtle interactive cues that guide the user through complex workflows like custom form building and data analysis.

## Colors
The color strategy utilizes **Deep Blue** (#1E3A8A) as the primary anchor to convey professionalism and institutional stability. **Professional Teal** (#0D9488) serves as the secondary color, used for success states and primary action buttons to create a calm yet distinct call-to-action.

- **Primary (Deep Blue):** Used for navigation, headers, and core brand elements.
- **Secondary (Teal):** Used for interactive elements like "Join Group" or "Submit Registration."
- **Tertiary (Amber):** Reserved for alerts, pending status, or highlighting the "Broadcast" feature.
- **Neutrals:** A range of Slate grays is used for typography and UI borders to ensure high legibility against the off-white (#F8FAFC) background.

The default mode is **Light**, optimizing for readability during daytime administrative work and registration on mobile devices.

## Typography
The system uses a dual-font approach to balance personality with utility. **Plus Jakarta Sans** is used for headings to provide a modern, approachable feel with its slightly rounded geometric forms. **Inter** is the workhorse for all body text, data tables, and forms, selected for its exceptional legibility at small sizes and high x-height.

Data-heavy views (Spreadsheets/Admin Dashboard) should exclusively use `body-sm` and `label-sm` to maximize information density without sacrificing clarity. All numeric data in tables should utilize tabular lining (mono-spaced numbers) to ensure columns align perfectly for easy scanning.

## Layout & Spacing
The layout uses a **12-column fluid grid** for desktop, transitioning to a **4-column grid** for mobile. 

- **Admin View:** Uses a "Sidebar + Content" model. The sidebar is fixed (280px) while the content area expands. Data tables are allowed to scroll horizontally (overflow-x: auto) to maintain column integrity.
- **Participant View:** Uses a centered "Container" model (max-width: 768px) to focus the user’s attention on forms and event information.
- **Rhythm:** A 4px base unit governs all spacing. Use 8px/16px for component internals and 24px/32px for section margins.

**Breakpoints:**
- Mobile: < 640px (Margins: 16px)
- Tablet: 640px - 1024px (Margins: 24px)
- Desktop: > 1024px (Margins: 40px)

## Elevation & Depth
The system uses **Tonal Layers** and **Low-contrast Outlines** rather than heavy shadows to maintain a clean, "software-as-a-service" look.

1.  **Level 0 (Background):** Surface-bg (#F8FAFC).
2.  **Level 1 (Cards/Sidebar):** Pure white background with a 1px solid border (#E2E8F0). No shadow.
3.  **Level 2 (Modals/Dropdowns):** Pure white background with a subtle ambient shadow (0px 4px 12px rgba(0,0,0,0.05)) and a border.
4.  **Active States:** Interactive elements use a subtle inner glow or a 2px colored border when focused, rather than changing elevation.

## Shapes
The system uses a **Soft** shape language. This ensures the interface feels modern and approachable but remains serious enough for corporate and academic environments.

- **Standard Elements:** Inputs, Buttons, and Cards use `rounded` (0.25rem / 4px).
- **Large Elements:** Group Banners and Modal containers use `rounded-lg` (0.5rem / 8px).
- **Chips/Badges:** Status indicators (e.g., "Active", "Pending") use `rounded-full` (pill-shaped) to distinguish them from interactive buttons.

## Components
### Buttons
- **Primary:** Solid Teal (#0D9488) with White text. Bold weight.
- **Secondary:** Transparent with Deep Blue (#1E3A8A) border and text.
- **Ghost:** No border, Primary Blue text, used for "Cancel" or "Go Back."

### Inputs & Forms
- Fields should have a height of 40px.
- Labels are placed above the field in `label-md` style.
- Required fields are marked with a primary-red asterisk.
- Focus state: 2px solid Deep Blue border with a soft blue ring.

### Tables (Spreadsheet View)
- Header row: Light gray background (#F1F5F9) with `label-sm` text.
- Row hover: Subtle change to #F8FAFC.
- High contrast: Alternating row stripes (Zebra striping) is avoided; use 1px horizontal dividers instead to maintain a modern look.

### Cards
- Layouts for "Multi-Grup Chat" banners should use a 16:9 aspect ratio.
- Event cards contain a thumbnail, date badge, and title.

### Chips
- Used for categories and status. Text is `label-sm`. Backgrounds should be low-saturation versions of the status color (e.g., light green background for "Check-in Complete").

### Checkboxes
- Custom styled with the Secondary Teal color when checked. The "Consent Clause" checkbox must be larger (20x20px) to ensure accessibility.