# LoveIDE

A single-file, in-browser IDE for authoring **LÖVE (Love2D)** games — a
notebook-style view over a real `main.lua` with a live love.js preview. The
whole app is one file, `index.html`. (An independent community tool, not
affiliated with or endorsed by the LÖVE project.)

Open `index.html` in a browser. No build step, no install.

## The core idea

`main.lua` **is** the single source of truth; the notebook is a pure projection
over it. The file always stays a valid, runnable `.lua`.

- A top-level, column-0 standalone `--[[ … ]]` block comment becomes a
  **Markdown cell** (long-bracket forms `--[==[ … ]==]` are handled too).
- A column-0 `-- %%` line is an invisible **code-cell separator**.
- The **md ⇄ lua toggle** is just comment / uncomment at cell granularity.
- Round-trip is idempotent: `serialize(parse(file)) === file`, whitespace and
  separators preserved byte-for-byte.

## What's here

| Module       | Status |
|--------------|--------|
| doc model (`parse`/`serialize`, idempotent) | ✅ tested |
| cell UI — badge type-switch, inter-cell insert zones, hover actions, collapse, reorder | ✅ |
| Lua editor — CodeMirror 6 (falls back to a plain editor offline) | ✅ |
| Markdown — marked.js (falls back to a built-in renderer offline) + WYSIWYG cells | ✅ |
| themes — warm / cool / mono × light / dark / auto (from the oracle) | ✅ |
| persistence — localStorage autosave + snapshot history | ✅ |
| asset manager (left activity bar) | ✅ basic |
| export runnable `.love` | ✅ |
| love.js preview (2dengine) | ⚠️ *requires cross-origin isolation — see below* |

The design language and many component patterns (theme system, layout, cell
cards, insert zones, CodeMirror/marked integration, Markdown WYSIWYG) are drawn
from Neodide's `notebook.html` — the oracle — adapted from Python/SQL to Lua/LÖVE.
CodeMirror, marked, and love.js load from CDNs on first use; everything else
(including the doc model and export) works fully offline.

Click **Tests** in the topbar to run the in-page round-trip / toggle self-tests.
The doc model is also exposed on `window.engine` for the console.

## Running the live preview

The preview builds a `.love` in the browser (JSZip) and boots it with
[2dengine/love.js](https://github.com/2dengine/love.js). love.js needs
`SharedArrayBuffer`, so the page must be **cross-origin isolated** — which means
it must be served over http(s)/localhost (not `file://`).

**Hosted (e.g. GitHub Pages):** keep `coi-serviceworker.js` (included) next to
`index.html`. It's the [gzuidhof](https://github.com/gzuidhof/coi-serviceworker)
service-worker trick — it injects the `COOP`/`COEP` headers so isolation just
works on a static host with no config. index.html registers it automatically
and reloads once to gain isolation. (Verified: when served with isolation, the
page reports `crossOriginIsolated === true` and Run proceeds to build the
`.love` and boot love.js.)

**Local:** with `coi-serviceworker.js` alongside it, any localhost server works —
e.g. `python3 -m http.server`, then open `http://localhost:8000/index.html`.

When isolation is missing, **Run** prints exactly what to do in the console.
Everything else (editing, the doc model, Markdown, and **Export .love**) works
offline — and the exported `.love` runs in desktop LÖVE regardless.

## Keyboard

- `Ctrl/Cmd + Enter` — Run preview
- `Ctrl/Cmd + S` — download `main.lua`

---

Spun out of Neodide; clean-room, separate product. See the founding design doc
for the full rationale.
