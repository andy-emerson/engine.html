/* ============================================================================
 * loveide-theme.js — Paper × Ink theme engine for LoveIDE
 * ----------------------------------------------------------------------------
 * Two orthogonal axes, computed parametrically in OKLCH:
 *
 *   Paper (t): 0 = lightest … 1 = darkest. Drives every NEUTRAL surface, text
 *              and border in pure grayscale. A symmetric "sprint" rushes the
 *              mid-greys (the Fog/Gloom band) and a dual text-halo carries
 *              glyphs through the low-contrast crossover.
 *   Ink   (w): 0 = steel … 1 = pink. Tints ONLY the five syntax slots.
 *              Steel = uniform cool-cast greys told apart by LIGHTNESS;
 *              Pink  = one constant lightness + chroma, told apart by HUE
 *              (magenta → coral, never blue/green/violet). The lightness flip
 *              that keeps grey legible fades out as pink rises, so pink stays a
 *              vivid, consistent brand colour on any paper.
 *
 * This module sets ONLY theme-driven tokens (the list under buildTheme). Brand,
 * action (Run/Stop) and status colours are intentionally NOT emitted — set those
 * yourself; the theme leaves them alone.
 *
 * No dependencies. Exposes window.LoveIDETheme. Pairs with loveide-theme.css.
 * ==========================================================================*/
(function (global) {
  'use strict';

  /* ---- helpers ----------------------------------------------------------- */
  var ok = function (l, c, h) { return 'oklch(' + (+l).toFixed(4) + ' ' + (+c).toFixed(4) + ' ' + h + ')'; };
  var lerp = function (a, b, p) { return a + (b - a) * p; };
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  // smoothstep — eased 0→1 ramp between two edges.
  var smooth = function (e0, e1, x) { var k = clamp01((x - e0) / (e1 - e0)); return k * k * (3 - 2 * k); };

  // The six named zones of the Paper slider (upper bound, name).
  var LEVELS = [[1/6, 'Midday'], [2/6, 'Sunlit'], [3/6, 'Fog'], [4/6, 'Gloom'], [5/6, 'Moonlit'], [1.01, 'Midnight']];

  var DEFAULTS = { t: 0.12, w: 0.82 };

  /* ---- the engine -------------------------------------------------------- *
   * buildTheme(t, w) → { '--var': 'value', … }  (Paper + Ink tokens only)    */
  function buildTheme(t, w) {
    t = clamp01(t); w = clamp01(w);
    var H = 80;                               // neutral hue, irrelevant at chroma 0

    // Paper polarity: flips ink dark↔light through the middle third (the sprint band).
    var pol = smooth(1/3, 2/3, t);
    var dark = pol > 0.5;

    // Fog halo: a light + dark ring on every glyph, peaking across the middle
    // third (Fog+Gloom) and exactly 0 outside it (crisp text). FOG_HALF = onset,
    // FOG_MAX = peak strength.
    var FOG_HALF = 1/3, FOG_MAX = 1.0;
    var x = Math.abs(2 * t - 1);
    var haloA = FOG_MAX * (1 - smooth(0, FOG_HALF, x));

    // Paper darkness, SYMMETRIC SPRINT: outer thirds move gently (fine control in
    // the readable ranges), the middle third sprints across the mid-greys.
    var d = t <= 1/3 ? lerp(0,    0.25, t / (1/3))
          : t <= 2/3 ? lerp(0.25, 0.75, (t - 1/3) / (1/3))
          :            lerp(0.75, 1,    (t - 2/3) / (1/3));

    var sL = function (a, b) { return ok(lerp(a, b, d), 0, H); };   // surfaces: dim along shaped darkness
    var iL = function (a, b) { return ok(lerp(a, b, pol), 0, H); }; // text: polarity flip

    // ---- Ink (syntax) ----
    // Hue eases steel→pink, front-loaded so the cross-wheel travel happens while
    // chroma is still low — no saturated violet at rest.
    var hueK = smooth(0, 0.17, w);
    // The lightness flip (dark-on-light ↔ light-on-dark) only exists to keep grey
    // legible against the paper. Pink reads on any grey on its own, so the flip
    // fades out in proportion to pink% — full flip at steel (polEff = pol), none
    // at pink (polEff = 0.5 → one constant vivid-pink lightness on both papers).
    var polEff = lerp(0.5, pol, 1 - w);
    // ONE uniform cool steel cast, ONE uniform pink chroma. Steel tokens differ by
    // LIGHTNESS (la/lb), pink tokens by HUE (hPink). la/lb symmetric around 0.62,
    // so every token lands on the SAME lightness at pink → pink differs by hue alone.
    var STEEL_C = 0.020, STEEL_H = 248, PINK_C = 0.130;
    var syn = function (la, lb, hPink) {
      return ok(lerp(la, lb, polEff), lerp(STEEL_C, PINK_C, w), lerp(STEEL_H, hPink, hueK));
    };

    // Borders: grey at an alpha that flips light↔dark with the paper.
    var inkCh = Math.round(lerp(44, 205, pol));
    var bd = function (a) { return 'rgba(' + inkCh + ',' + inkCh + ',' + inkCh + ',' + a + ')'; };

    return {
      /* ---- Paper: neutral surfaces (grayscale) ---- */
      '--bg-primary':   sL(1.0,   0.235),
      '--bg-secondary': sL(0.965, 0.195),
      '--bg-tertiary':  sL(0.912, 0.285),
      '--bg-info':      sL(0.935, 0.262),
      /* ---- Paper: text (grayscale) ---- */
      '--text-primary':   iL(0.30, 0.915),
      '--text-secondary': iL(0.46, 0.66),
      '--text-tertiary':  iL(0.63, 0.50),
      /* ---- Paper: borders (grayscale) ---- */
      '--border-faint':  bd(0.10),
      '--border-light':  bd(0.18),
      '--border-medium': bd(0.30),
      '--border-info':   ok(lerp(0.56, 0.60, pol), 0, H),
      /* ---- Ink: syntax (the only themed colour) ---- *
       * syn(lightL, darkL, pinkHue); la/lb symmetric around 0.62.             *
       * steel → distinguished by lightness; pink → distinguished by hue.      */
      '--syntax-keyword':  syn(0.34,  0.90,  340),  // widest L-swing (steel) · magenta (pink)
      '--syntax-number':   syn(0.42,  0.82,   16),  // · rose
      '--syntax-function': syn(0.48,  0.76,  356),  // · pink
      '--syntax-string':   syn(0.54,  0.70,   32),  // · coral / salmon
      '--syntax-operator': syn(0.585, 0.655, 350),  // narrowest L-swing (steel) · muted pink
      /* ---- text halo (Paper; ~0 except in the Fog/Gloom band) ---- */
      '--ink-halo-d': 'oklch(0.05 0 ' + H + ' / ' + haloA.toFixed(3) + ')',
      '--ink-halo-l': 'oklch(0.99 0 ' + H + ' / ' + haloA.toFixed(3) + ')',
      /* ---- optional UI shadow (paper-derived; delete if unused) ---- */
      '--shadow': dark ? '0 14px 38px rgba(0,0,0,.5)' : '0 14px 38px rgba(40,40,40,.14)'
    };
  }

  /* ---- apply / query ----------------------------------------------------- */

  // Apply the theme by setting the CSS variables on `root` (default :root) and
  // updating color-scheme so native controls / scrollbars follow.
  function applyTheme(t, w, root) {
    root = root || document.documentElement;
    var v = buildTheme(t, w);
    for (var k in v) if (v.hasOwnProperty(k)) root.style.setProperty(k, v[k]);
    document.documentElement.style.colorScheme = t > 0.5 ? 'dark' : 'light';
    return v;
  }

  // Name of the Paper zone for a position (Midday … Midnight).
  function levelName(t) {
    t = clamp01(t);
    for (var i = 0; i < LEVELS.length; i++) if (t <= LEVELS[i][0]) return LEVELS[i][1];
    return 'Midnight';
  }

  /* ---- persistence ------------------------------------------------------- */
  function load(key) {
    try { var s = JSON.parse(localStorage.getItem(key)); if (s && typeof s.t === 'number' && typeof s.w === 'number') return { t: s.t, w: s.w }; } catch (e) {}
    return { t: DEFAULTS.t, w: DEFAULTS.w };
  }
  function save(key, st) { try { localStorage.setItem(key, JSON.stringify({ t: st.t, w: st.w })); } catch (e) {} }

  /* ---- UI wiring --------------------------------------------------------- *
   * init({ paperSlider, inkSlider, levelEl, pctEl, root, storageKey })       *
   * Wires two <input type=range> (0..1, step .01). Loads the saved position, *
   * applies, and persists on every change. Any option may be a selector or a *
   * DOM element; levelEl/pctEl are optional readouts. Returns a controller.   */
  function el(ref) { return typeof ref === 'string' ? document.querySelector(ref) : (ref || null); }

  function init(opts) {
    opts = opts || {};
    var root = el(opts.root) || document.documentElement;
    var key = opts.storageKey || 'loveide:appearance';
    var st = load(key);
    var paper = el(opts.paperSlider), ink = el(opts.inkSlider);
    var levelEl = el(opts.levelEl), pctEl = el(opts.pctEl);

    function render() {
      applyTheme(st.t, st.w, root);
      if (levelEl) levelEl.textContent = levelName(st.t);
      if (pctEl) pctEl.textContent = Math.round(st.t * 100) + '%';
    }
    if (paper) {
      paper.value = String(st.t);
      paper.addEventListener('input', function (e) { st.t = parseFloat(e.target.value); save(key, st); render(); });
    }
    if (ink) {
      ink.value = String(st.w);
      ink.addEventListener('input', function (e) { st.w = parseFloat(e.target.value); save(key, st); render(); });
    }
    render();

    return {
      get state() { return { t: st.t, w: st.w }; },
      set: function (t, w) {
        st = { t: clamp01(t), w: clamp01(w) };
        if (paper) paper.value = String(st.t);
        if (ink) ink.value = String(st.w);
        save(key, st); render();
      }
    };
  }

  global.LoveIDETheme = {
    buildTheme: buildTheme,
    applyTheme: applyTheme,
    levelName: levelName,
    init: init,
    LEVELS: LEVELS,
    DEFAULTS: DEFAULTS
  };
})(typeof window !== 'undefined' ? window : this);
