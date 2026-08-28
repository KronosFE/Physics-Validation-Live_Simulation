/* Kronos live engine — runs the published kronos_toolkit breeder 0-D balance in the
   browser via Pyodide (WebAssembly Python). New-canon (2026-08-27): reproduces
   Q 3.0763 at the frozen config-22021 anchor. Nothing leaves the tab.
   Auto-wires any .live-recompute widget on the page. */
(function () {
  "use strict";
  var PYV = "v0.26.4";
  var FIXED = { R0: 1.2, delta: -0.3, f_he4: 0.05 };
  var FROZEN = { fuel: "DT", B0: 8.0, A: 2.5, kappa: 2.0, q95: 3.0, fG: 0.3, Ti0: 15, TBR_dt: 1.8 };
  var OUTS = [
    ["Q", "Fusion gain Q", "", 4],
    ["P_fus_MW", "Fusion power", "MW", 2],
    ["Ip_MA", "Plasma current", "MA", 3],
    ["T_kg_yr", "Tritium", "kg/yr", 3],
    ["f_n", "Neutron fraction", "", 4]
  ];
  var py = null, anchors = null, ready = null;

  function status(msg, cls) {
    document.querySelectorAll("[data-lr-status]").forEach(function (el) {
      el.textContent = msg; el.className = "lr-status" + (cls ? " " + cls : "");
    });
  }

  async function boot() {
    status("loading the WebAssembly engine… (first load pulls numpy + scipy, ~15 s)");
    var mod = await import("https://cdn.jsdelivr.net/pyodide/" + PYV + "/full/pyodide.mjs");
    py = await mod.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/" + PYV + "/full/" });
    await py.loadPackage(["numpy", "scipy"]);
    var manifest = await (await fetch("../engine/manifest.json", { cache: "no-cache" })).json();
    for (var i = 0; i < manifest.length; i++) {
      var rel = manifest[i];
      var src = await (await fetch("../engine/" + rel, { cache: "no-cache" })).text();
      var full = "/tk/" + rel, dir = full.slice(0, full.lastIndexOf("/"));
      try { py.FS.mkdirTree(dir); } catch (e) {}
      py.FS.writeFile(full, src);
    }
    py.runPython([
      "import sys, json",
      "sys.path.insert(0, '/tk')",
      "from kronos_toolkit.core import evaluate_breeder",
      "from kronos_toolkit.verify.anchors import BREEDER_ANCHORS",
      "def _eval(s):",
      "    p = json.loads(s)",
      "    r = evaluate_breeder(fuel=p['fuel'], R0=" + FIXED.R0 + ", A=p['A'], kappa=p['kappa'], B0=p['B0'],",
      "                         q95=p['q95'], fG=p['fG'], Ti0=p['Ti0'], TBR_dt=p['TBR_dt'],",
      "                         f_he4=" + FIXED.f_he4 + ", delta=" + FIXED.delta + ")",
      "    return json.dumps({k: r[k] for k in ['Q','P_fus_MW','Ip_MA','T_kg_yr','f_n']})",
      "_A = {k: BREEDER_ANCHORS[k]['value'] for k in BREEDER_ANCHORS}",
      "def _anchors(): return json.dumps(_A)"
    ].join("\n"));
    anchors = JSON.parse(py.runPython("_anchors()"));
    status("engine ready — runs entirely in this tab (kronos_toolkit, WASM Python).", "ok");
  }

  function evalPoint(inp) {
    return JSON.parse(py.runPython("_eval('" + JSON.stringify(inp).replace(/'/g, "\\'") + "')"));
  }

  function wire(widget) {
    var controls = widget.querySelectorAll("input[type=range][data-k], select[data-k]");
    var outEl = widget.querySelector("[data-lr-out]");
    var anchEl = widget.querySelector("[data-lr-anchor]");
    function read() {
      var o = {};
      controls.forEach(function (c) { o[c.dataset.k] = c.type === "range" ? parseFloat(c.value) : c.value; });
      return o;
    }
    function render() {
      var inp = read();
      var r;
      try { r = evalPoint(inp); } catch (e) { outEl.innerHTML = '<div class="lr-err">engine error — try Reset</div>'; return; }
      outEl.innerHTML = OUTS.map(function (o) {
        var v = r[o[0]]; var s = (typeof v === "number") ? v.toFixed(o[3]) : v;
        return '<div class="lr-tile"><div class="k">' + o[1] + (o[2] ? " (" + o[2] + ")" : "") +
               '</div><div class="v">' + s + "</div></div>";
      }).join("");
      // anchor check when at frozen defaults
      var atFrozen = Object.keys(FROZEN).every(function (k) {
        return String(inp[k]) === String(FROZEN[k]);
      });
      if (atFrozen && anchors) {
        var okQ = Math.abs(r.Q - anchors.Q) <= 1e-3;
        anchEl.innerHTML = okQ
          ? '<span class="ok">&#10003; reproduces the frozen config-22021 anchor — Q ' + anchors.Q.toFixed(4) + ' (2026-08-27 canon)</span>'
          : '<span class="warn">anchor mismatch — Q ' + r.Q.toFixed(4) + ' vs ' + anchors.Q.toFixed(4) + '</span>';
      } else {
        anchEl.innerHTML = '<span class="dim">exploring off the frozen point — move sliders back to Reset for the anchor check</span>';
      }
    }
    controls.forEach(function (c) {
      c.addEventListener("input", function () {
        var out = c.parentNode.querySelector("output");
        if (out && c.type === "range") out.textContent = c.value;
        render();
      });
    });
    var reset = widget.querySelector("[data-lr-reset]");
    if (reset) reset.addEventListener("click", function () {
      controls.forEach(function (c) {
        if (c.dataset.k in FROZEN) { c.value = FROZEN[c.dataset.k]; var o = c.parentNode.querySelector("output"); if (o) o.textContent = c.value; }
      });
      render();
    });
    ready.then(render).catch(function () {
      status("could not load the engine (offline?). The equations are open at github.com/KronosFE/kronos-toolkit.", "warn");
    });
  }

  function init() {
    var widgets = document.querySelectorAll(".live-recompute");
    if (!widgets.length) return;
    ready = boot();
    widgets.forEach(wire);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
