# CLAUDE.md — working agreement for LoveIDE

Operational instructions for the coding agent working on this repo. Short on
purpose. The "why" lives in `design.md`; the live frontier lives in `TODO.md`.

## What this is

LoveIDE is a **single-file, in-browser notebook IDE for LÖVE (Love2D) games**.
The whole app is `index.html`. `main.lua` is the **single source of truth**; the
notebook is a pure projection over it (`serialize(parse(x)) === x`, byte-for-byte).

## The oracle

`notebook.html` (Neodide) is the **design reference** — a source of intent and
inspiration, **not a hard spec and not a line-by-line duplication target**.
Read the relevant part of the oracle before building a feature it also has, and
say what you took and what you changed. When LoveIDE diverges (and it often
should — we have no DuckDB substrate and no reactivity branch), record the
divergence in `design.md`'s ledger and move on. Matching the oracle is never the
goal; a coherent LoveIDE is.

## Claim ladder — never let a claim outrun its evidence

Grade every claim you make by the strongest rung you actually reached:

1. **Stated** — written, not run.
2. **Tested** — exercised headless (node round-trip, luaparse AST, a DOM check).
3. **Dependency-verified** — confirmed against the real library, not a guess
   about its behavior.
4. **Browser-verified** — you (or the user) loaded `index.html` and watched it
   work.

The failure mode is a claim sitting one rung above its evidence. Some things are
**only** browser-verifiable in this sandbox and you must say so plainly:

- **love.js boot** (needs cross-origin isolation + CDN egress).
- **WebLLM / WebGPU** (needs a GPU and model download).
- Any **CDN library load** (CodeMirror, marked, JSZip, luaparse, web-llm).

For these, do the most you can headless (validate the data shape, parse the AST,
diff the serialized doc) and then flag the remaining gap as browser-only. Don't
dress up "Stated" as "works."

## Verify outside the conversation

Before claiming a parser/analysis change works, run it in node against the real
dependency (install from npm if needed) and check the output. Prefer
understatement: report what you saw, name what you couldn't test.

## Single-file constraints

- Everything ships in `index.html`. No build step, no bundler, no local
  `node_modules` in the served artifact.
- External libs load **from CDN, lazily, with an offline/degraded fallback**
  (textarea instead of CodeMirror, built-in markdown instead of marked, etc.).
  Never hard-fail the app because a CDN is unreachable.
- State persists in `localStorage` (doc, history, conf, theme, opts) and
  **IndexedDB** (binary assets — Blobs, not base64). Don't reintroduce base64
  asset storage.
- The runtime is a **fresh iframe per run** so love.js gets a clean Module.

## Code readability standard (applies to index.html)

Model: `notebook.html` (the oracle). Required:

1. **Top-of-file architecture map** — a comment block naming the subsystems and
   the one read path they share (`main.lua` → doc model → everything).
2. **Numbered banner sections + a table of contents.** Keep the existing
   `════ N. TITLE ════` banners; the TOC up top lists them so the structure is
   visible without scrolling. CSS half and JS half each get their own numbering.
3. **A docstring on every function** — one line on what it's for / what it
   returns. Add the non-obvious invariant if there is one.
4. **Comments explain *why*, not *what*.** Reserve them for decisions, gotchas,
   and ported-from-the-oracle notes (e.g. the `<base href>` love.js fix). Don't
   narrate code that speaks for itself.
5. **Aligned assignment columns**, `_`-prefixed internals — cheap scan-value.

Retrofit opportunistically and in reviewable passes; don't rewrite the whole
file in one commit.

## Working rhythm

- **Design-first.** The user holds design authority and drives one slice at a
  time. When intent is ambiguous, ask before building; don't guess at scope.
- Build the smallest coherent increment, verify it as far up the ladder as the
  sandbox allows, then report honestly.
- Keep `TODO.md` as the clean frontier and update the `design.md` ledger when a
  subsystem's status or a divergence changes.

## Commits

- Develop on the designated feature branch; create it locally if missing.
- Clear, descriptive messages: what changed and why, present tense.
- Commit and push only when the work is a coherent unit. Do not open a PR unless
  asked.
- Never put model identifiers or internal tooling notes in committed artifacts.
