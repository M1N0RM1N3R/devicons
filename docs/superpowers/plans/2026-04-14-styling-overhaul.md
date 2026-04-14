# Styling Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate duplicated CSS patterns into shared utilities, then apply targeted visual refinements across the entire Devicons website.

**Architecture:** Two-phase approach. Phase 1 extracts 5 shared CSS utilities and cleans up magic numbers — pure refactoring with no visual change. Phase 2 applies visual refinements to each section (hero, marquee, CTA, footer, docs, 404, global). Each task produces a self-contained commit.

**Tech Stack:** Astro, Tailwind CSS v4, CSS custom properties, React (for install-tabs component)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/styles/global.css` | Modify | Add `.copy-btn`, `.tab-group`/`.tab-item`, `.badge` utilities; update scrollbar styles; consolidate transitions |
| `src/components/home/hero-section.astro` | Modify | Extract grid to shared class; tighten spacing; adjust eyebrow, title, CTA |
| `src/components/home/icon-marquee.astro` | Modify | Add hover/pause/edge-fade; use shared scroll keyframe |
| `src/components/layout/navbar.astro` | Modify | Add active bottom-bar indicator |
| `src/components/layout/footer.astro` | Modify | Adjust watermark opacity, link hovers, grid columns |
| `src/components/layout/geometric-grid.astro` | Create | Shared geometric grid + backdrop component |
| `src/pages/index.astro` | Modify | Update CTA section padding and button treatment |
| `src/pages/404.astro` | Modify | Use shared grid component; use shared scroll keyframe; card hover; button hierarchy |
| `src/layouts/Docs.astro` | Modify | Tighten header gap; use `.badge` class |
| `src/components/docs/docs-sidebar.astro` | Modify | Active state bg tint; use `.badge` class |
| `src/components/ui/install-tabs.tsx` | Modify | Switch from `.install-tabs__list`/`.install-tabs__tab` to `.tab-group`/`.tab-item`; switch `.install-snippet__copy` to `.copy-btn` |
| `src/lib/code-copy.ts` | Modify | Switch from `.code-copy` to `.copy-btn` |

---

### Task 1: Extract `.copy-btn` utility

Merge `.code-copy` (global.css:697-746) and `.install-snippet__copy` (global.css:960-1009) into a single `.copy-btn` class.

**Files:**
- Modify: `src/styles/global.css` — lines 697-746 and 960-1009
- Modify: `src/lib/code-copy.ts` — line 8 and 11
- Modify: `src/components/ui/install-tabs.tsx` — line 98

- [ ] **Step 1: Add `.copy-btn` class to global.css**

In `src/styles/global.css`, after the existing `.code-copy` block (around line 746), add the new shared class. Then replace `.code-copy` with `.copy-btn` and remove `.install-snippet__copy` entirely.

Replace the `.code-copy` block (lines 697-746) with:

```css
/* Shared copy button — used in prose code blocks and install snippets.
   Sits top-right of a position:relative parent, hidden until hover. */
.copy-btn {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  background: var(--c-bg);
  color: var(--c-text-muted);
  border: 0;
  border-left: 1px solid var(--c-border);
  border-bottom: 1px solid var(--c-border);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.copy-btn:hover {
  color: var(--c-accent);
  border-color: var(--c-accent);
}

.copy-btn:focus-visible {
  outline: 2px solid var(--c-accent);
  outline-offset: -2px;
  color: var(--c-accent);
}

.copy-btn[data-state="copied"] {
  background: var(--c-accent);
  color: var(--c-accent-fg);
  border-color: var(--c-accent);
  opacity: 1;
}
```

Update the visibility triggers (lines 727-731) to reference `.copy-btn`:

```css
.prose pre:hover .copy-btn,
.prose pre:focus-within .copy-btn,
.copy-btn:focus-visible {
  opacity: 1;
}
```

Update the install-snippet visibility triggers (lines 990-994) to reference `.copy-btn`:

```css
.install-snippet__block:hover .copy-btn,
.install-snippet__block:focus-within .copy-btn {
  opacity: 1;
}
```

Delete the entire `.install-snippet__copy` block (lines 960-1009).

- [ ] **Step 2: Update code-copy.ts**

In `src/lib/code-copy.ts`, change the class references:

Line 8: change `pre.querySelector(".code-copy")` to `pre.querySelector(".copy-btn")`
Line 11: change `btn.className = "code-copy"` to `btn.className = "copy-btn"`

- [ ] **Step 3: Update install-tabs.tsx**

In `src/components/ui/install-tabs.tsx`, line 98: change `className="install-snippet__copy"` to `className="copy-btn"`

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/ and http://localhost:4321/docs — verify copy buttons appear on hover for both prose code blocks and install snippets. Click to copy and verify the "OK" / copied state works.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/lib/code-copy.ts src/components/ui/install-tabs.tsx
git commit -m "refactor: extract shared .copy-btn utility from .code-copy and .install-snippet__copy"
```

---

### Task 2: Extract `.tab-group` / `.tab-item` utilities

Merge `.tabs`/`.tabs__btn` (global.css:800-832) and `.install-tabs__list`/`.install-tabs__tab` (global.css:862-893) into shared classes.

**Files:**
- Modify: `src/styles/global.css` — lines 800-832 and 862-893
- Modify: `src/components/ui/install-tabs.tsx` — lines 119, 126

- [ ] **Step 1: Add shared tab classes to global.css**

Replace the `.tabs` block (lines 800-832) with:

```css
/* Shared tab group — inline pill switcher used for code-style tabs
   and install-framework tabs. */
.tab-group {
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
}

.tab-item {
  background: transparent;
  border: 0;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--c-text-muted);
  line-height: var(--leading-flat);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tab-item:hover {
  color: var(--c-text);
  background: var(--c-surface-2);
}

.tab-item[aria-selected="true"],
.tab-item[aria-pressed="true"] {
  color: var(--c-accent);
  background: color-mix(in oklab, var(--c-accent) 15%, transparent);
}
```

Keep `.tabs` and `.tabs__btn` as aliases below:

```css
/* Aliases — backwards compat for existing Astro markup. */
.tabs { @apply tab-group; }
.tabs__btn { @apply tab-item; }
```

Wait — Tailwind v4 doesn't support `@apply` with custom classes in `@layer components`. Instead, just keep `.tabs` and `.tabs__btn` definitions pointing to the same values. Actually, the simplest approach: rename in the CSS and update the markup.

Delete the `.install-tabs__list` block (lines 862-893) entirely.

- [ ] **Step 2: Update install-tabs.tsx**

In `src/components/ui/install-tabs.tsx`:
- Line 119: change `className="install-tabs__list"` to `className="tab-group"`
- Line 126: change `className="install-tabs__tab"` to `className="tab-item"`

- [ ] **Step 3: Verify in browser**

Open an icon detail page or the search page that shows install tabs. Verify tabs render correctly with proper hover and selected states.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css src/components/ui/install-tabs.tsx
git commit -m "refactor: extract shared .tab-group/.tab-item from .tabs and .install-tabs"
```

---

### Task 3: Extract `.badge` utility

Replace inline badge styles duplicated in `Docs.astro` and `docs-sidebar.astro`.

**Files:**
- Modify: `src/styles/global.css` — add badge classes
- Modify: `src/layouts/Docs.astro` — lines 66-69
- Modify: `src/components/docs/docs-sidebar.astro` — lines 62-69

- [ ] **Step 1: Add `.badge` classes to global.css**

Add after the button section (around line 425):

```css
/* Badge — tiny mono label for status indicators (new, updated, beta). */
.badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.125rem 0.375rem;
  border: 1px solid var(--c-border);
  line-height: 1;
  display: inline-block;
}

.badge--new {
  border-color: color-mix(in oklab, var(--c-accent) 40%, transparent);
  color: var(--c-accent);
  background: color-mix(in oklab, var(--c-accent) 10%, transparent);
}

.badge--updated {
  border-color: color-mix(in oklab, var(--c-success) 40%, transparent);
  color: var(--c-success);
  background: color-mix(in oklab, var(--c-success) 10%, transparent);
}

.badge--beta {
  border-color: var(--c-border);
  color: var(--c-text-muted);
  background: var(--c-surface);
}
```

- [ ] **Step 2: Update Docs.astro**

In `src/layouts/Docs.astro`, replace the badge span (lines 65-70):

```astro
{
  badge && (
    <span class:list={['badge', `badge--${badge}`]}>
      {badge}
    </span>
  )
}
```

Remove the `badgeStyles` record (lines 29-33) since it's no longer needed.

- [ ] **Step 3: Update docs-sidebar.astro**

In `src/components/docs/docs-sidebar.astro`, replace the badge span (lines 61-69):

```astro
{entry.data.badge && (
  <span class:list={['badge', `badge--${entry.data.badge}`]}>
    {entry.data.badge}
  </span>
)}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/docs — verify badges render on sidebar entries with correct colors per variant.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/layouts/Docs.astro src/components/docs/docs-sidebar.astro
git commit -m "refactor: extract shared .badge utility with variant modifiers"
```

---

### Task 4: Extract shared geometric grid component

Create `geometric-grid.astro` to replace duplicated grid CSS in hero and 404.

**Files:**
- Create: `src/components/layout/geometric-grid.astro`
- Modify: `src/components/home/hero-section.astro` — remove grid CSS, use component
- Modify: `src/pages/404.astro` — remove grid CSS, use component

- [ ] **Step 1: Create geometric-grid.astro**

```astro
---
interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<div class:list={["geometric-grid__wrap", className]} aria-hidden="true">
  <div class="geometric-grid__lines"></div>
  <div class="geometric-grid__backdrop"></div>
</div>

<style>
  .geometric-grid__wrap {
    position: absolute;
    inset: 0;
    pointer-events: none;
    --c-grid: 230, 230, 230;
  }
  :global([data-theme='light']) .geometric-grid__wrap {
    --c-grid: 23, 23, 23;
  }

  .geometric-grid__lines {
    position: absolute;
    inset: 0;
    --grid-line: rgba(var(--c-grid), 0.06);
    --grid-major: rgba(var(--c-grid), 0.06);
    background:
      linear-gradient(0deg, var(--grid-line) 1px, transparent 1px) 0 0 / 48px 48px,
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px) 0 0 / 48px 48px,
      linear-gradient(0deg, var(--grid-major) 1px, transparent 1px) 0 0 / 320px 320px,
      linear-gradient(90deg, var(--grid-major) 1px, transparent 1px) 0 0 / 320px 320px;
    mask-image: linear-gradient(180deg, transparent 0%, black 12%, black 48%, transparent 100%);
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, black 12%, black 48%, transparent 100%);
  }
  :global([data-theme='light']) .geometric-grid__lines {
    --grid-line: rgba(var(--c-grid), 0.07);
    --grid-major: rgba(var(--c-grid), 0.15);
  }

  .geometric-grid__backdrop {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 50% at 72% 55%, rgba(255, 77, 0, 0.1) 0%, transparent 60%),
      radial-gradient(ellipse 55% 45% at 18% 78%, rgba(255, 107, 43, 0.05) 0%, transparent 55%),
      linear-gradient(180deg, rgba(var(--c-overlay), 0.55) 0%, transparent 30%, transparent 70%, rgba(var(--c-overlay), 0.65) 100%);
  }
</style>
```

- [ ] **Step 2: Update hero-section.astro**

In `src/components/home/hero-section.astro`:

Add import at top of frontmatter:
```astro
import GeometricGrid from '../layout/geometric-grid.astro';
```

Replace the two backdrop divs (lines 62-63):
```astro
<div class="hero-backdrop" aria-hidden="true"></div>
<div class="hero-grid" aria-hidden="true"></div>
```

With:
```astro
<GeometricGrid />
```

Delete the `.hero-grid` CSS block (lines 128-162) and the `.hero-backdrop` CSS block (lines 164-186) and the `.hero` `--c-grid` variable (lines 188-197) from the `<style>` section.

- [ ] **Step 3: Update 404.astro**

In `src/pages/404.astro`:

Add import at top of frontmatter:
```astro
import GeometricGrid from '../components/layout/geometric-grid.astro';
```

Replace the two backdrop divs (lines 17-18):
```astro
<div class="notfound-grid" aria-hidden="true"></div>
<div class="notfound-backdrop" aria-hidden="true"></div>
```

With:
```astro
<GeometricGrid />
```

Delete the `.notfound-grid` CSS (lines 128-166), `.notfound-backdrop` CSS (lines 168-183), and the `.notfound` `--c-grid` variable (lines 121-126) from the `<style>` section.

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/ and http://localhost:4321/404 — verify the geometric grid background renders identically in both dark and light themes.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/geometric-grid.astro src/components/home/hero-section.astro src/pages/404.astro
git commit -m "refactor: extract shared geometric-grid component from hero and 404"
```

---

### Task 5: Unify scroll keyframes

Replace `marquee-scroll` and `notfoundScroll` with shared `scroll-infinite`.

**Files:**
- Modify: `src/components/home/icon-marquee.astro` — lines 90, 94-101
- Modify: `src/pages/404.astro` — lines 247, 257-264
- Modify: `src/styles/global.css` — add shared keyframe

- [ ] **Step 1: Add shared keyframe to global.css**

Add at the end of global.css (after all component styles):

```css
/* Shared infinite scroll — used by marquee strips and ticker bands.
   Pair with width:max-content + duplicated content for seamless loop. */
@keyframes scroll-infinite {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
```

- [ ] **Step 2: Update icon-marquee.astro**

In `src/components/home/icon-marquee.astro`:

Line 90: change `animation: marquee-scroll 60s linear infinite;` to `animation: scroll-infinite 60s linear infinite;`

Delete the `@keyframes marquee-scroll` block (lines 94-101).

- [ ] **Step 3: Update 404.astro**

In `src/pages/404.astro`:

Line 247: change `animation: notfoundScroll 32s linear infinite;` to `animation: scroll-infinite 32s linear infinite;`

Delete the `@keyframes notfoundScroll` block (lines 257-264).

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/ — verify marquee scrolls. Open http://localhost:4321/404 — verify the bottom strip scrolls.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/components/home/icon-marquee.astro src/pages/404.astro
git commit -m "refactor: unify scroll keyframes into shared @keyframes scroll-infinite"
```

---

### Task 6: Hero visual refinements

Tighten spacing, add eyebrow separator, adjust title line-height, improve CTA hierarchy.

**Files:**
- Modify: `src/styles/global.css` — `--leading-display` token
- Modify: `src/components/home/hero-section.astro` — markup and styles

- [ ] **Step 1: Adjust display line-height token**

In `src/styles/global.css` line 94, change:
```css
--leading-display: 0.9;
```
to:
```css
--leading-display: 0.85;
```

- [ ] **Step 2: Add eyebrow separator to hero**

In `src/components/home/hero-section.astro`, update the eyebrow (line 70-72):

```astro
<p class="hero-eyebrow type-label mb-4 sm:mb-5 flex items-center gap-3">
  <span aria-hidden="true" class="inline-block w-3 h-[2px] bg-accent"></span>
  {iconCount.toLocaleString()} Icons / MIT / Open Source
</p>
```

- [ ] **Step 3: Tighten hero spacing**

In `src/components/home/hero-section.astro`, update the CTA section (line 77):

Change `mt-6 sm:mt-8` to `mt-5 sm:mt-6`:
```astro
<div class="hero-actions flex flex-wrap items-center gap-3 mt-5 sm:mt-6">
```

- [ ] **Step 4: Simplify install command CTA**

In `src/components/home/hero-section.astro`, update the install button (lines 80-84):

Change from:
```astro
<button
  type="button"
  data-copy={INSTALL_CMD}
  class="hero-copy btn btn--ghost type-mono">
  <span data-label>$ {INSTALL_CMD}</span>
</button>
```

To:
```astro
<button
  type="button"
  data-copy={INSTALL_CMD}
  class="hero-copy type-mono text-text-muted hover:text-accent transition-colors cursor-pointer border-0 bg-transparent">
  <span data-label class="border-b border-transparent hover:border-accent">$ {INSTALL_CMD}</span>
</button>
```

- [ ] **Step 5: Verify in browser**

Open http://localhost:4321/ — verify tighter title leading, eyebrow has accent dash, install command is minimal text (no box border), "Browse Icons" is clearly the dominant CTA.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/components/home/hero-section.astro
git commit -m "style: tighten hero spacing, add eyebrow separator, simplify install CTA"
```

---

### Task 7: Marquee visual refinements

Add tile hover, pause-on-hover, and edge fade masks.

**Files:**
- Modify: `src/components/home/icon-marquee.astro`

- [ ] **Step 1: Add edge fade masks**

In `src/components/home/icon-marquee.astro`, add to the `.marquee` styles (after line 58):

```css
.marquee::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 48px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(90deg, var(--c-bg), transparent);
}

.marquee__frame::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 48px;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(270deg, var(--c-bg), transparent);
}
```

Update `.marquee__frame` to add `position: relative;` (it already has it on line 79).

- [ ] **Step 2: Add pause-on-hover**

Add after the `.marquee__track` block:

```css
.marquee:hover .marquee__track {
  animation-play-state: paused;
}
```

- [ ] **Step 3: Add tile hover state**

Add after the `.marquee__tile` block:

```css
.marquee__tile {
  transition: border-color 0.15s ease;
}

.marquee__tile:hover {
  border-color: var(--c-accent);
}

.marquee__tile:hover .marquee__icon {
  transform: scale(1.05);
  transition: transform 0.15s ease;
}
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/ — verify:
1. Edge fades appear on left and right of marquee
2. Hovering over the strip pauses scrolling
3. Hovering individual tiles highlights border and scales icon

- [ ] **Step 5: Commit**

```bash
git add src/components/home/icon-marquee.astro
git commit -m "style: add marquee edge fades, pause-on-hover, and tile hover states"
```

---

### Task 8: CTA section refinements

More presence with accent bar, proper button, and breathing room.

**Files:**
- Modify: `src/pages/index.astro` — lines 18-28

- [ ] **Step 1: Update CTA section**

In `src/pages/index.astro`, replace lines 18-28:

```astro
<div class="h-[200px]" aria-hidden="true"></div>
<div class="border-t border-border px-6 py-16 max-w-[1400px] mx-auto">
  <h2 class="type-display-sm flex flex-col gap-4">
    <span>Ship with better icons.</span>
    <a
      href="/docs"
      class="text-accent hover:text-accent-hover transition-colors">
      Read the docs &rarr;
    </a>
  </h2>
</div>
```

With:

```astro
<div class="h-[200px]" aria-hidden="true"></div>
<div class="border-t border-border px-6 py-24 max-w-[1400px] mx-auto">
  <p class="type-label mb-4 flex items-center gap-3">
    <span aria-hidden="true" class="inline-block w-3 h-[2px] bg-accent"></span>
    Get Started
  </p>
  <h2 class="type-display-sm mb-8">Ship with better icons.</h2>
  <a href="/docs" class="btn btn--primary btn--mono">
    Read the docs &rarr;
  </a>
</div>
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:4321/ — scroll to bottom. Verify the CTA section has more vertical space, an accent-bar eyebrow, the headline, and a solid orange button.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "style: strengthen CTA section with accent bar, button treatment, and more breathing room"
```

---

### Task 9: Footer refinements

Adjust watermark, link hovers, fix grid columns.

**Files:**
- Modify: `src/components/layout/footer.astro`

- [ ] **Step 1: Reduce watermark opacity**

In `src/components/layout/footer.astro`, line 95 in the `<style>` section, change:
```css
opacity: 0.07;
```
to:
```css
opacity: 0.04;
```

- [ ] **Step 2: Add accent hover to footer links**

In `src/components/layout/footer.astro`, update all link classes. Change each `hover:text-text` to `hover:text-accent`.

Line 17: change `class="type-body-sm hover:text-text transition-colors"` to `class="type-body-sm hover:text-accent transition-colors"`

Line 24: change `class="type-body-sm hover:text-text transition-colors"` to `class="type-body-sm hover:text-accent transition-colors"`

Line 33: change `class="type-body-sm hover:text-text transition-colors"` to `class="type-body-sm hover:text-accent transition-colors"`

- [ ] **Step 3: Collapse to 2-column grid**

In `src/components/layout/footer.astro`, line 9: change `md:grid-cols-3` to `md:grid-cols-2`.

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/ — scroll to footer. Verify:
1. Watermark is more subtle
2. Links turn accent orange on hover
3. Grid uses 2 columns without empty space

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/footer.astro
git commit -m "style: refine footer watermark opacity, link hovers, and grid layout"
```

---

### Task 10: Docs visual refinements

Sidebar active bg, h3 accent bar, header spacing.

**Files:**
- Modify: `src/components/docs/docs-sidebar.astro` — active state
- Modify: `src/styles/global.css` — prose h3
- Modify: `src/layouts/Docs.astro` — header gap

- [ ] **Step 1: Add sidebar active background**

In `src/components/docs/docs-sidebar.astro`, update the active link class (line 46):

Change:
```
active ? "text-accent" : "text-text-muted hover:text-text",
```

To:
```
active ? "text-accent bg-accent/5" : "text-text-muted hover:text-text",
```

- [ ] **Step 2: Add h3 accent bar in prose**

In `src/styles/global.css`, after the prose h3 block (around line 550), add:

```css
.prose h3 {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
}

.prose h3::before {
  content: "";
  display: inline-block;
  width: 0.5em;
  height: 2px;
  background: var(--c-text-muted);
  flex-shrink: 0;
  align-self: center;
}
```

Note: The existing h3 rule already defines font-size, margin-top, letter-spacing, and line-height. Merge the `display`, `gap` properties into the existing rule, and add the `::before` pseudo-element separately.

- [ ] **Step 3: Tighten docs header spacing**

In `src/layouts/Docs.astro`, line 51: change `gap-5` to `gap-3`:

```astro
<header class="mb-10 flex flex-col gap-3 pb-8 border-b border-border">
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:4321/docs — verify:
1. Active sidebar item has subtle orange background tint
2. h3 headings have a muted dash prefix
3. Header section is tighter

- [ ] **Step 5: Commit**

```bash
git add src/components/docs/docs-sidebar.astro src/styles/global.css src/layouts/Docs.astro
git commit -m "style: refine docs sidebar active state, h3 accent bars, and header spacing"
```

---

### Task 11: 404 page refinements

Terminal card hover, button hierarchy (already uses shared grid from Task 4).

**Files:**
- Modify: `src/pages/404.astro`

- [ ] **Step 1: Add terminal card hover**

In `src/pages/404.astro`, update the `.notfound-card` styles. After the existing rule:

```css
.notfound-card {
  position: relative;
  box-shadow: 8px 8px 0 0 var(--c-border);
  transition: border-color 0.15s ease;
}

.notfound-card:hover {
  border-color: var(--c-accent);
}
```

- [ ] **Step 2: Improve button hierarchy**

In `src/pages/404.astro`, the Home button (line 50) already has `btn btn--primary btn--mono`. To make it more dominant, remove `btn--mono` and keep it at default size while the others stay small:

Change line 50:
```astro
<a href="/" class="btn btn--primary btn--mono"> &larr; Home </a>
```
To:
```astro
<a href="/" class="btn btn--primary btn--mono px-8"> &larr; Home </a>
```

This gives the Home button more horizontal presence via wider padding while keeping the same style family.

- [ ] **Step 3: Verify in browser**

Open http://localhost:4321/404 — verify:
1. Terminal card border turns accent on hover
2. Home button is visually dominant

- [ ] **Step 4: Commit**

```bash
git add src/pages/404.astro
git commit -m "style: add 404 terminal card hover and strengthen Home button"
```

---

### Task 12: Global & Navbar refinements

Navbar active indicator, scrollbar styling, transition audit.

**Files:**
- Modify: `src/components/layout/navbar.astro` — active bottom bar
- Modify: `src/styles/global.css` — scrollbar styles

- [ ] **Step 1: Add navbar active bottom bar**

In `src/components/layout/navbar.astro`, update the nav link markup (lines 23-31). Change the active link class to include a bottom indicator:

Change:
```astro
<a
  href={link.href}
  class:list={[
    'navbar-link transition-colors hidden sm:block',
    link.active ? 'text-accent' : 'text-text-muted hover:text-text',
  ]}>
  {link.label}
</a>
```

To:
```astro
<a
  href={link.href}
  class:list={[
    'navbar-link transition-colors hidden sm:block relative',
    link.active ? 'text-accent' : 'text-text-muted hover:text-text',
  ]}>
  {link.label}
  {link.active && (
    <span
      aria-hidden="true"
      class="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"
    />
  )}
</a>
```

- [ ] **Step 2: Enhance scrollbar styling**

In `src/styles/global.css`, update the scrollbar styles (lines 461-464):

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--c-bg); }
::-webkit-scrollbar-thumb {
  background: var(--c-border);
  transition: background 0.15s ease;
}
::-webkit-scrollbar-thumb:hover {
  background: color-mix(in oklab, var(--c-accent) 50%, var(--c-text-muted));
}
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:4321/docs — verify:
1. Active nav link has accent bottom bar
2. Scrollbar thumb in sidebar turns accent-tinted on hover

Open http://localhost:4321/search — verify "All Icons" nav link has the accent bar.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/navbar.astro src/styles/global.css
git commit -m "style: add navbar active indicator and enhance scrollbar styling"
```

---

### Task 13: Final verification sweep

Cross-check all changes in both themes.

**Files:** None (verification only)

- [ ] **Step 1: Dark theme verification**

Open http://localhost:4321/ in dark mode. Walk through:
1. Hero: tight leading, accent-bar eyebrow, minimal install CTA
2. Marquee: edge fades, hover pause, tile hover
3. CTA section: accent bar, orange button, generous padding
4. Footer: subtle watermark, accent link hover, 2-col grid
5. Navigate to /docs: sidebar active bg tint, h3 dashes, tight header, badges
6. Navigate to /404: shared grid, card hover, dominant Home button, scrolling strip

- [ ] **Step 2: Light theme verification**

Toggle to light mode and repeat the same walkthrough. Pay attention to:
- Geometric grid lines are visible
- Accent colors meet AA contrast
- Scrollbar thumb hover is visible
- Copy buttons appear and work
- Selection color is consistent

- [ ] **Step 3: Reduced motion verification**

Enable `prefers-reduced-motion: reduce` in browser dev tools. Verify:
- Marquee stops scrolling
- 404 strip stops scrolling
- 404 spinning "0" stops
- Hero fade animations are skipped

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "style: fix issues found during final verification sweep"
```
