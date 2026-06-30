# LoveIDE — Paper × Ink theme

A two-axis, parametric theme engine for LoveIDE, computed in OKLCH. Drop-in
vanilla JS + CSS — no framework, no build step.

- **`loveide-theme.js`** — the engine + apply + persistence + slider wiring (`window.LoveIDETheme`).
- **`loveide-theme.css`** — `@property` registrations (smooth cross-fade), the fog text-halo, and the two slider skins.
- **`theme-demo.html`** — a standalone reference page that proves the exact math and shows the Appearance-panel markup.

Open `theme-demo.html` to see it run.

## The two axes

| Axis | Range | Controls |
|------|-------|----------|
| **Paper** `t` | `0` light → `1` dark | every **neutral** surface, text and border, in pure grayscale |
| **Ink** `w` | `0` steel → `1` pink | **only** the five syntax colours |

A user never picks a theme — they set these two sliders, and every token is
derived from them.

### What's baked into the math
- **Paper sprint** — the slider moves gently through the readable light/dark
  ranges and *sprints* across the mid-greys (the "Fog / Gloom" middle third).
- **Fog halo** — a dual light+dark glyph ring (`--ink-halo-*`) that blooms only
  in that middle third, carrying text through the low-contrast crossover; it's
  exactly 0 elsewhere (crisp text).
- **Steel** — one uniform cool-cast grey; the five tokens are told apart by
  **lightness**.
- **Pink** — one constant lightness + chroma; the tokens are told apart by
  **hue** alone (magenta → coral, never blue/green/violet).
- **Flip fade** — the dark-on-light ↔ light-on-dark lightness flip fades out as
  Ink approaches pink, so pink stays a vivid, consistent colour on any paper.

## What it sets — and what it deliberately doesn't

`buildTheme(t, w)` returns **only** these theme-driven CSS variables:

```
--bg-primary  --bg-secondary  --bg-tertiary  --bg-info
--text-primary  --text-secondary  --text-tertiary
--border-faint  --border-light  --border-medium  --border-info
--syntax-keyword  --syntax-number  --syntax-function  --syntax-string  --syntax-operator
--ink-halo-d  --ink-halo-l
--shadow            (optional UI shadow; delete if unused)
```

It does **not** emit brand / action / status colours (Run pink, Stop red,
status greens, Lua/Markdown badges). Those are **theme-immune** — set them
yourself (hard-coded hex or your own variables). The theme leaves them alone.

## Integrate into `index.html`

**1. Include the files.**
```html
<link rel="stylesheet" href="loveide-theme.css">
<script src="loveide-theme.js"></script>
```

**2. Mark your app root** so the fog-halo (and optional cross-fade) apply:
```html
<body class="loveide-themed">…</body>
```
Add `class="loveide-fade"` to surfaces/text you want to cross-fade on change.

**3. Drop in the two sliders** (Appearance settings):
```html
<span id="paper-level">Midday</span> <span id="paper-pct">12%</span>
<input id="paper" class="nd-range"        type="range" min="0" max="1" step="0.01">
<input id="ink"   class="nd-range nd-wc"  type="range" min="0" max="1" step="0.01">
```

**4. Wire it (one call).**
```js
LoveIDETheme.init({
  paperSlider: '#paper',
  inkSlider:   '#ink',
  levelEl:     '#paper-level',   // optional readout
  pctEl:       '#paper-pct',     // optional readout
  // root:       document.documentElement,   // where vars are set (default)
  // storageKey: 'loveide:appearance'        // localStorage key (default)
});
```
`init` loads the saved position, applies it, and persists `{t, w}` on every
change. Reads stay synchronous; nothing flashes on load.

## API

```js
LoveIDETheme.buildTheme(t, w) // → { '--var': value, … }  (pure; no DOM)
LoveIDETheme.applyTheme(t, w, root?) // set vars on root (default :root) + color-scheme
LoveIDETheme.levelName(t)     // 'Midday' | 'Sunlit' | 'Fog' | 'Gloom' | 'Moonlit' | 'Midnight'
LoveIDETheme.init(opts)       // wire sliders + persistence → controller { state, set(t,w) }
LoveIDETheme.LEVELS           // the zone table
LoveIDETheme.DEFAULTS         // { t: 0.12, w: 0.82 }
```

## Notes

- **Smooth cross-fade** comes from the `@property` registrations + a `transition`
  on whatever paints the tokens (the `.loveide-fade` helper, or your own rules).
  Without a transition the change is instant (still correct).
- **`color-scheme`** is set to `dark`/`light` automatically (so native scrollbars
  and form controls follow the paper).
- **OKLCH** is required (all evergreen browsers since ~2023). The colours can't be
  represented as static hex because they're computed continuously.
- **Migrating** from the old `{mode, tone}` theme: the new stored shape is
  `{t, w}`. Pick a fresh `storageKey` or clear the old one once.
- The syntax slots map to CodeMirror tags as: keyword → keywords/control;
  number → number/bool/atom; function → function & method names; string →
  strings; operator → operators/punctuation. Comments stay grayscale
  (`--text-tertiary`); identifiers use `--text-primary`.
