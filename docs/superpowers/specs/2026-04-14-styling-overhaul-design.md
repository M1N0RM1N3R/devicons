# Devicons Website Styling Overhaul

**Date:** 2026-04-14
**Scope:** Full site — global styles, homepage, docs, 404, all components
**Approach:** Bottom-up token tightening — consolidate duplicated CSS, then targeted visual refinements
**Palette:** Keep existing (orange accent, monochrome base)
**Aesthetic:** Refined brutalist — tighter and more impactful, same DNA

---

## Phase 1: CSS Consolidation

### 1.1 Extract shared utility classes

| New class | Replaces | Used in |
|-----------|----------|---------|
| `.accent-bar` | Repeated `border-left: 2-3px solid var(--c-accent)` + `1px border` pattern | prose h2, code blocks, blockquotes, notes, docs TOC active |
| `.copy-btn` | `.code-copy` + `.install-snippet__copy` (identical styling) | prose code blocks, install snippet |
| `.tab-group` / `.tab-item` | `.tabs` + `.install-tabs__list` / `.install-tabs__tab` | generic tabs, framework picker |
| `.geometric-grid` | Duplicated 48px/320px grid + radial wash + mask | hero section, 404 page |
| `@keyframes scroll-infinite` | Duplicated `translateX(-50%)` loop keyframes | icon marquee, 404 strip |

### 1.2 Extract shared badge class

`.badge` base class with `.badge--new`, `.badge--updated`, `.badge--beta` modifiers. Replaces inline badge styles in `Docs.astro` and `docs-sidebar.astro`.

### 1.3 Magic number cleanup

Replace any remaining hard-coded `px` values in component styles with token references (`--space-*`, `--text-*`). Ensure all `font-size`, `padding`, `margin`, `gap` use the token scale.

---

## Phase 2: Visual Refinements

### 2.1 Hero Section

- **Tighter spacing**: Reduce gap between eyebrow, title, and CTAs for more visual tension.
- **Eyebrow separator**: Add accent dash bar before eyebrow text (same pattern as 404 page label).
- **Title line-height**: Drop from 0.9 to 0.85 for display size. At `clamp(3rem,10vw,8rem)` the current leading creates too much air.
- **CTA hierarchy**: Switch install command from `btn--ghost` (bordered) to a minimal treatment — no border, mono text, subtle underline-on-hover. "Browse Icons" stays the clear primary CTA.

### 2.2 Icon Marquee

- **Tile hover state**: Border-color transitions to accent, icon scales up 1.05x on hover.
- **Pause on hover**: `animation-play-state: paused` on track hover.
- **Edge fade**: Add left/right gradient masks (same as 404 strip) so tiles don't hard-clip at viewport edges.

### 2.3 CTA Section (bottom of homepage)

- **More presence**: Add accent dash bar, tighter tracking, give link a proper `btn--primary btn--mono` treatment instead of plain text link.
- **Vertical breathing room**: Increase padding from `py-16` to `py-24`.

### 2.4 Footer

- **Brand watermark opacity**: Reduce from 0.07 to 0.04 — less competition with footer content.
- **Footer link hover**: Add accent color on hover (currently only transitions to `--c-text`).
- **Third column**: Fill the empty 3rd column or collapse grid to 2-col to avoid empty space.

### 2.5 Docs Layout & Prose

- **Sidebar active state**: Add subtle `bg-accent/5` background tint on active item for more visual weight.
- **Prose h3 accent bar**: Extend the h2 `::before` dash pattern to h3 (shorter dash, muted color) for consistent hierarchy.
- **Code block left rail**: Extract the 3px accent left-border pattern to the shared `.accent-bar` utility.
- **Docs header spacing**: Tighten gap from `gap-5` to `gap-3`.

### 2.6 404 Page

- **Use shared geometric grid**: Replace duplicated grid CSS with the extracted `.geometric-grid` component.
- **Use shared scroll animation**: Replace `@keyframes notfoundScroll` with shared `@keyframes scroll-infinite`.
- **Terminal card hover**: Add border-color transition to accent on hover.
- **Button hierarchy**: "Home" button gets more dominance — slightly larger with `btn--primary`.

### 2.7 Global & Navbar

- **Focus ring consistency**: All interactive elements use `outline: 2px solid var(--c-accent); outline-offset: 2px`.
- **Navbar active link**: Add 2px accent bottom-bar under active nav link for stronger wayfinding.
- **Transition consistency**: Standardize all transitions to `150ms ease`.
- **Selection color**: Verify `::selection` covers all contexts in both themes.
- **Scrollbar styling**: Minimal scrollbar for docs sidebar — thin, accent-tinted thumb on surface track.

---

## Out of Scope

- Color palette changes (keeping existing orange accent + monochrome)
- New components or features
- JavaScript behavior changes (only CSS/HTML)
- Search island styling (React component, separate concern)

## Success Criteria

- Zero duplicated CSS patterns (grid, scroll, copy-btn, tabs, badges)
- All spacing/sizing values reference design tokens
- Every interactive element has a visible hover and focus state
- Consistent accent-bar pattern across all bordered elements
- Tighter visual rhythm on hero, docs header, and CTA section
- Both themes (dark/light) verified for all changes
