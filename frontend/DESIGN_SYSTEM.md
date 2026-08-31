# Luxury Real Estate Management System — Design System Specification

## 1. Visual Philosophy & Brand Identity
The UI is designed for high-end luxury and enterprise real estate operations. It balances trust, clarity, and sophistication. The visual tone departs from generic SaaS blues, utilizing a deep midnight slate foundation accented with prestigious warm gold and crisp semantic indicators.

---

## 2. Color Palette & Tokens

### A. Surface & Neutrals (Midnight Luxury)
- **Background Root**: `#070D1E` (Darkest Navy Base)
- **Surface Level 1 (Sidebar / Card)**: `#0B132B` / `#0E1730`
- **Surface Level 2 (Inputs / Dropdowns / Hover)**: `#142142` / `#1C2B54`
- **Surface Level 3 (Borders / Dividers)**: `#223363` / `#2E437D`
- **Text Primary**: `#F8FAFC` (Slate 50)
- **Text Secondary**: `#94A3B8` (Slate 400)
- **Text Muted**: `#64748B` (Slate 500)

### B. Accent (Prestige Real Estate Gold)
- **Gold Light / Glow**: `#FDE68A` (Amber 200)
- **Gold Primary**: `#D4AF37` / `#F59E0B` (Prestige Amber Gold)
- **Gold Dark / Border**: `#B45309` (Amber 700)
- **Gold Surface Tint**: `rgba(212, 175, 55, 0.12)`

### C. Semantic Status Colors
| State | Light Tint (Background) | Solid (Border / Text) | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `rgba(16, 185, 129, 0.12)` | `#10B981` (Emerald 500) | Available, Sold, Paid, Closed |
| **Warning** | `rgba(245, 158, 11, 0.12)` | `#F59E0B` (Amber 500) | Under Negotiation, Booked, Partial |
| **Danger / Alert** | `rgba(239, 68, 68, 0.12)` | `#EF4444` (Rose 500) | Cancelled, Overdue, Partial Overdue |
| **Info / Process** | `rgba(59, 130, 246, 0.12)` | `#3B82F6` (Blue 500) | In Progress, Rented, Tenant |
| **Purple / Royal** | `rgba(168, 85, 247, 0.12)` | `#A855F7` (Purple 500) | Landlord, Exclusive Listings |

---

## 3. Typography
- **Primary Sans**: `Geist Sans` / `Plus Jakarta Sans` / `system-ui`
- **Monospace (References / Numbers)**: `Geist Mono` / `ui-monospace`
- **Hierarchy**:
  - `Display / Page Heading`: `text-2xl font-bold tracking-tight text-white`
  - `Section Heading`: `text-lg font-semibold text-slate-100`
  - `Card Header`: `text-sm font-medium text-slate-300 uppercase tracking-wider`
  - `Body`: `text-sm font-normal text-slate-300`
  - `Caption / Muted`: `text-xs font-normal text-slate-500`

---

## 4. Spacing & Elevation Scales
- **Spacing Units**: Standard 4px base (`p-2`, `p-4`, `p-6`, `p-8`).
- **Border Radius**:
  - Elements / Buttons / Inputs: `rounded-xl` (12px)
  - Cards & Containers: `rounded-2xl` (16px)
  - Pills & Badges: `rounded-full` (9999px)
- **Glassmorphism & Shadows**:
  - Glass Card: `bg-slate-900/60 backdrop-blur-md border border-slate-800/80 shadow-xl shadow-slate-950/40`
  - Floating Modal: `bg-slate-900 border border-slate-700 shadow-2xl shadow-black/80`

---

## 5. Reusable Component Library

1. **`Button`**:
   - Variants: `primary`, `gold`, `secondary`, `outline`, `danger`, `ghost`
   - Sizes: `sm`, `md`, `lg`
   - States: `default`, `hover`, `active`, `disabled`, `loading` (animated spinner)

2. **`Input` & `Select`**:
   - Focus ring: `ring-2 ring-amber-500/50 border-amber-500`
   - Icon slot: Left leading icon support
   - Error state: `border-rose-500 ring-rose-500/30 text-rose-300`

3. **`Badge` / `StatusPill`**:
   - Pre-mapped color codes for:
     - **Properties**: `available` (Emerald), `under_negotiation` (Amber), `sold` (Emerald solid), `rented` (Blue)
     - **Deals**: `negotiation` (Blue), `booked` (Amber), `in_progress` (Indigo), `completed` (Emerald), `cancelled` (Rose)
     - **Payments**: `paid` (Emerald), `partial` (Amber), `pending` (Slate/Blue), `overdue` (Rose), `partial_overdue` (Orange-Red)
     - **Roles**: `admin` (Purple), `agent` (Gold), `accountant` (Emerald), `staff` (Slate)

4. **`Card`**: Structured container with optional hover-glow and header actions.
5. **`Table`**: Modern data table with hover striping, responsive horizontal overflow, and embedded empty states.
6. **`Modal`**: Backdrop-blur overlay, smooth scale animation, close on escape.
7. **`Toast`**: Top-right stacking toast notifications with automated timer dismiss.
8. **`Skeleton`**: Shimmer gradient animation for cards, tables, text lines, and metric tiles.
9. **`EmptyState`**: Centered illustration, bold title, descriptive subtitle, and primary call-to-action button.
