# engine.html

A single-file, in-browser IDE for authoring **LÖVE (Love2D)** games — a
notebook-style view over a real `main.lua` with a live love.js preview.

Open `engine.html` in a browser. No build step, no install.

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
| cell UI (add/delete/reorder, md⇄lua toggle, Lua editor) | ✅ |
| built-in Markdown renderer | ✅ |
| persistence (localStorage autosave + snapshot history) | ✅ |
| asset manager (left activity bar) | ✅ basic |
| export runnable `.love` | ✅ |
| love.js preview (2dengine) | ✅ *requires isolation — see below* |

Click **✓ Tests** in the title bar to run the in-page round-trip / toggle
self-tests. The doc model is also exposed on `window.engine` for the console.

## Running the live preview

The preview builds a `.love` in the browser (JSZip) and boots it with
[2dengine/love.js](https://github.com/2dengine/love.js). love.js needs
`SharedArrayBuffer`, so the page must be served **cross-origin isolated** over
http(s) — it will not work from `file://`. Serve with these response headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

For example:

```sh
npx http-server -p 8080 --cors \
  -H "Cross-Origin-Opener-Policy: same-origin" \
  -H "Cross-Origin-Embedder-Policy: require-corp"
```

When isolation is missing, **Run** explains exactly what to do. Everything else
(editing, the doc model, Markdown, and **Export .love**) works offline — and the
exported `.love` runs in desktop LÖVE regardless.

## Keyboard

- `Ctrl/Cmd + Enter` — Run preview
- `Ctrl/Cmd + S` — download `main.lua`

---

Spun out of Neodide; clean-room, separate product. See the founding design doc
for the full rationale.
