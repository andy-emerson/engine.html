# LoveIDE — TODO

Working notes for `index.html` (the app is one file). Led by the agent plan,
followed by the rest of the backlog and open questions.

---

## Agent plan

### The model
The agent is a **collaborator, not a chatbot**. It runs a selectable **Mode**
(a protocol), has **Sight** (reads the project), optional **Hands** (acts on
cells / conf / assets via tools), on a **Backend** (local WebLLM and/or a remote
API), and communicates through **Scaffolding** the app enforces. One system
message — rebuilt each turn from live state — is where Sight lives; tools are the
Hands channel; a Mode is data (system prompt + sight/hands level + backend
preference), eventually user-authored.

Three driving ideas (from the oracle, kept):
1. **Local + remote collaboration.** Local (WebLLM) is free/fast/private but
   weak; remote is frontier-quality. Use local as a cheap scout and remote as
   the closer. Variant: local attempts a step behind a checkpoint; on failure the
   app reverts and escalates to remote with the failed attempt + error.
2. **Modes.** A named protocol = system prompt + config. Assistant (casual),
   Tutor (one runnable step at a time — and in LoveIDE each step is a real cell
   that shows on the game canvas), Rigor (the scaffolding discipline). Rigid
   modes need a capable model (remote); a local 1.5B can't hold them.
3. **Scaffolding that reduces miscommunication.** The agent presents a frontier
   of options the human picks from (never railroads); every claim carries a
   grade and may not sit above its evidence; deviations are surfaced. Claims are
   graded by **witnessed actions** — enforced by the substrate, not trusted to
   the prompt.

### How LoveIDE differs from the oracle (important)
The oracle's plan is built around a **DuckDB runtime substrate** shared with a
**reactivity** branch. LoveIDE has neither, which *simplifies* the foundation:

- **`main.lua` is already the single source of truth.** There is no separate DB
  state to serialize — **Sight = serialization of the doc model + the static
  analysis we already compute (Variables/Tables via luaparse) + the love.js
  Console**. No `_ql_*`, no DuckDB.
- **No reactivity branch.** `main.lua` is one program, not a reactive cell graph,
  so the "build the substrate once, two branches unblock" argument doesn't apply.
  The oracle's heavy Step 1 mostly collapses for us.
- **Sight is static + Console.** Our Variables/Tables are *static* (parsed
  source), not runtime values. The agent sees the code + Console (print/errors)
  but not live game state (e.g. `player.x` at frame 600) unless we add a runtime
  **debug bridge** into the running love instance — optional (see open questions).
- **Witnessing is coarser but already wired.** The witnessed signal is "the
  `.love` booted and ran without a Lua error," captured via the iframe→Console
  bridge — vs the oracle's typed query/var results. Coarser, but it's exactly
  what makes local-try → revert → escalate natural.
- **Checkpoint/revert is nearly free.** A snapshot is `serialize(nb.doc)` (+ conf);
  the History snapshot/restore machinery already exists. No `exportDBBytes` analog.

### Already built
- WebGPU capability probe (`detectWebGPU`, `agent.gpu`).
- Settings → Agent config home.
- Local-model manager — the three oracle models (Qwen2.5-Coder 1.5B / 3B / 7B)
  with a disk axis (Install / Remove) and VRAM axis (Activate / Deactivate, one
  active at a time), VRAM-fit gray-out, lazy WebLLM import, live progress.
- Streaming chat in the Agent tab over the active model; `main.lua` sent as a
  crude Sight v0; "Insert as cell" for ```lua blocks.
- Agent status pill (idle / loading / ready / error).

The chat is otherwise **blind** — no real Sight, no Hands.

### Shippable milestones
- After **Step 3** (project-aware chat on a frontier remote model) — the 80/20.
- After **Step 7** (full Hands + scaffolding).

### Steps (LoveIDE-adapted)

| # | Phase | Item | LoveIDE notes |
|---|-------|------|---------------|
| 1 | Foundation | Console as a real RHS tab + `buildContext()` seam | No DuckDB substrate. Promote the Console strip to a proper RHS tab (Preview · Variables · Tables · **Console**); define the single read path Sight + panels share. |
| 2 | Sight | `buildContext()` (the curated brief) | Assemble system message each turn from `main.lua` (serialized) + symbols/tables (luaparse) + recent Console output + conf; per-backend token budget. Makes chat project-aware. Safe on any model. |
| 3 | Backends | Backend interface + Remote | `backend.chat(messages, {tools, stream})`; add a remote provider (key via Secrets; Anthropic direct-browser header / OpenRouter — mind CORS). Unlocks frontier reasoning → prerequisite for reliable modes/hands. **80/20 milestone.** |
| 4 | Modes | Mode configs + selector | Assistant / Tutor / Rigor as data (prompt + sight/hands level + backend pref); selector in Settings → Agent; each declares a recommended backend. |
| 5 | Hands | Read-only tools + tool loop | `get_cell`, `list_cells`, `get_symbols`, `get_tables`, `get_console`, `get_conf`, `list_assets/libs`; call → execute → feed-back loop; app witnesses results. Zero mutation risk. Reliable only on capable (remote) models. |
| 6 | Hands | Checkpoint / revert | Snapshot `serialize(nb.doc)` (+ conf) before any agent action; one-click restore (reuse History/Stop machinery). Nearly free; basis for local-try-then-escalate. |
| 7 | Hands | Write/run tools + scaffolding UI | Mutating tools (`add_cell`, `edit_cell`, `delete_cell`, `toggle_cell`, `set_conf`, `run`); options rendered as clickable next-steps (human picks one small step); claim badges from witnessed runs (booted green vs Lua error); deviation/activity record in the Console tab. Full Tutor/Rigor experience. |
| 8 | Collaboration | Local-try → revert → remote-escalate | Local edits a cell behind a checkpoint; on Lua error in the Console, revert + escalate to remote with the failed attempt + error. |
| 9 | Collaboration | Scout/solver orchestration | Local gathers/distills context cheaply; remote solves with the curated brief. Cuts remote token cost. |
| 10 | On top | User-authored modes | Modes are data, so teachers/users write their own (classroom feature) — text + config, no engine change. |

### Open questions
1. **Runtime Sight:** static source + Console only, or invest in a live **debug
   bridge** into the running game (read `_G`/watches each frame)?
2. **Witnessing richness:** is "boots vs errors" enough to grade claims, or do we
   want richer signals (canvas screenshot diff, FPS, agent-written assertions)?
3. **Secrets/remote:** resolve the BYO-key decision (provider = Anthropic +
   OpenAI-compatible?; storage = localStorage + "don't save" + sanitized model
   output, vs passphrase-encrypted). Required for Step 3.

---

## Backlog (non-agent)

- **Console → dedicated RHS tab** (also Step 1 above): love.js print/errors +
  build log, with Clear; currently a strip under the canvas.
- **File System Access API** — open/save against a *real* project folder so files
  land where desktop LÖVE can run them (no export step). Chromium-only;
  progressive enhancement with download-export as the fallback. (Distinct from
  OPFS, which gives no user-visible files.)
- **Runtime debug bridge / live inspector** — inject a small module into the
  `.love` to surface live values / a Lua REPL in the Console (the runtime
  counterpart to the static Variables/Tables).
- **Hot-reload on edit** — debounced auto-Run after edits.
- **Vendor icons** — optionally drop the handful of SVGs we use locally instead of
  CDN-anything (we already hand-roll inline SVG; no Tabler webfont dependency).
- **love.js boot** — confirm end-to-end across browsers when served
  cross-origin-isolated; the runtime can't be exercised in the dev sandbox (CDN
  egress blocked there).
- **Export polish** — fused web build option; asset drag-and-drop into the .love.

## From the founding design doc — still open
- True in-place love.js hot-restart vs full Module recreate (currently fresh
  iframe per run).
- Editing model: cells-only, or also a raw-file view kept in sync.
- Project/bundle format once assets grow.
- Branding: **resolved → LoveIDE** (hot-pink `#EC4899` "Love" + steel `#7C8A99`
  "IDE"; heart-`</>` mark shelved).

## Hosting
Live on GitHub Pages from `main`; `coi-serviceworker.js` grants the cross-origin
isolation love.js needs with no server config. The app is served directly as
`index.html`, so it loads at the site root with no redirect.
