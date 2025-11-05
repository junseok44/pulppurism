# Design Guidelines: Civic Engagement Platform

## Design Approach

**System Selected:** Material Design principles adapted for Korean civic engagement

**Justification:** This platform prioritizes clarity, accessibility, and trust. Material Design's emphasis on hierarchy, responsive grids, and established patterns ensures citizens can efficiently navigate complex information while maintaining a professional, government-appropriate aesthetic.

**Core Principles:**
- Information clarity over visual embellishment
- Hierarchical content organization
- Accessible, readable typography for all ages
- Mobile-first responsive patterns
- Trust-building through consistency

---

## Typography

### Font Families
**Primary (Korean/CJK):** Noto Sans KR (400, 500, 700)
**Secondary (English/Numbers):** Inter (400, 500, 600)

### Type Scale
- **Hero/Display:** text-4xl to text-5xl (36-48px), font-bold
- **Page Titles:** text-3xl (30px), font-bold
- **Section Headers:** text-2xl (24px), font-semibold
- **Card Titles:** text-xl (20px), font-semibold
- **Body Large:** text-lg (18px), font-normal
- **Body Standard:** text-base (16px), font-normal
- **Body Small/Meta:** text-sm (14px), font-normal
- **Caption/Labels:** text-xs (12px), font-medium

### Hierarchy Rules
- All headings use Noto Sans KR for Korean content
- Body text maintains 1.6-1.7 line-height for readability
- Admin interfaces use slightly tighter spacing (1.5) for density
- Opinion/comment text uses text-base with generous line-height for readability

---

## Layout System

### Spacing Primitives (Tailwind Units)
**Standard Set:** Use exclusively p-2, p-4, p-6, p-8, p-12, p-16, p-20

**Application:**
- **Micro spacing** (p-2): Icon-to-text, tight button padding
- **Component spacing** (p-4, p-6): Card padding, form field spacing
- **Section spacing** (p-8, p-12): Between content blocks, card margins
- **Page spacing** (p-16, p-20): Page-level padding, section separators

### Grid System
- **Container:** max-w-7xl mx-auto for main content
- **Opinion/Agenda Cards:** Single column mobile, 2-column md:, 3-column lg:
- **Admin Dashboard:** 12-column grid for flexible layouts
- **Form Layouts:** max-w-2xl for optimal form width

### Responsive Breakpoints
- Mobile: Base (< 768px)
- Tablet: md: (768px+)
- Desktop: lg: (1024px+)
- Wide: xl: (1280px+)

---

## Component Library

### Navigation
**Main Navigation:** Bottom tab bar (mobile), Top horizontal (desktop)
- Three primary tabs: 안건 (Agendas), 주민의견 (Opinions), 마이페이지 (My Page)
- Tab icons from Heroicons with labels
- Active state with underline/fill indicator
- Search icon in header (right-aligned)

### Cards
**Opinion Card:**
- Thumbnail (48px × 48px rounded-full)
- User name, timestamp (text-sm)
- Opinion preview (text-base, 3-line clamp)
- Engagement row: Heart icon + count, Comment icon + count
- Three-dot menu (author only)

**Agenda Card:**
- Category badge (top-left, text-xs rounded-full px-3 py-1)
- Title (text-xl, 2-line clamp)
- Metadata row: Comment count, Status badge, Bookmark count
- Status indicator (pill-shaped, text-sm)
- Bookmark icon (top-right)

### Forms
**Input Fields:**
- Label above input (text-sm font-medium)
- Input height: h-12
- Border: border rounded-lg
- Focus: ring-2 ring-offset-2
- Multi-line textarea: min-h-32

**Buttons:**
- Primary CTA: h-12 px-6 rounded-lg font-semibold
- Secondary: h-10 px-5 rounded-lg font-medium
- Icon buttons: w-10 h-10 rounded-full
- Floating action button: w-14 h-14 rounded-full fixed bottom-6 right-6

### Data Display
**Voting Widget:**
- Three-column grid (찬성/중립/반대)
- Each option: rounded-lg p-4 border-2
- Selected state: thicker border
- Percentage bars below options (h-2 rounded-full)

**Timeline:**
- Vertical stepper (left-aligned)
- Circle markers (w-8 h-8) connected by vertical line
- Completed states filled, current outlined, future ghosted
- Date labels (text-sm) right of markers

**Statistics Cards (Admin):**
- Grid of 2×2 (mobile) to 4×1 (desktop)
- Large number (text-4xl font-bold)
- Label below (text-sm)
- Trend indicator (arrow + percentage)

### Lists
**Infinite Scroll List:**
- Gap-4 between items
- Skeleton loading states
- "Load more" trigger at 80% scroll
- Empty state illustration + text

**Comment Thread:**
- Depth-1 only
- Indented replies: pl-12
- Avatar-name-timestamp row
- Comment text below
- Like + Reply actions

### Modals & Overlays
**Full-Screen Modal (Mobile):**
- Header: Back arrow, Title, Action button
- Scrollable content: p-6
- Fixed bottom CTA bar: p-4 border-top

**Dialog (Desktop):**
- Max-w-lg centered
- Rounded-xl shadow-2xl
- Header, content, footer sections
- Overlay backdrop

---

## Images

### Hero Images
**Admin Dashboard:** Subtle abstract geometric pattern or civic building illustration (1920×400px)
**Landing/Welcome:** Citizens engaging with technology, diverse community (1920×600px)

### Opinion Thumbnails
User profile photos (default avatar if not set)

### Agenda Detail Pages
Optional featured image (16:9 ratio, max 1200×675px) showing relevant civic infrastructure or community spaces

### Reference Materials
Document icons for files (PDF, HWP), Link preview cards with favicon + title for external URLs

### Empty States
Illustration style: Simple line art with minimal detail
- Empty opinions: Megaphone or speech bubble
- No agendas: Clipboard or document
- No notifications: Bell icon

### Icons
**Library:** Heroicons (outline for inactive, solid for active states)
**Common Icons:** 
- Heart (likes), ChatBubble (comments), Bookmark, Search, User, Menu
- ThumbUp (찬성), MinusCircle (중립), ThumbDown (반대)
- Document, Link, Image, Bell

---

## Animations

Minimal, purposeful motion only:
- Page transitions: Simple fade (200ms)
- Modal entrance: Slide-up (250ms)
- List item appearance: Stagger fade-in (50ms delay)
- Loading states: Skeleton pulse
- NO hover effects, NO complex animations