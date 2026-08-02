"""
kronos_engine.py — thin browser wrapper over the deposited Kronos engines.

It runs the ACTUAL deposit code, unmodified:
  * breeder : dt_evaluator.evaluate() + kronos_clean kernels   (DOI 10.5281/zenodo.21746157)
  * reactivity : kronos_clean.sigmav() (Bosch-Hale)
The burner (D-3He tandem mirror, DOI 10.5281/zenodo.21746479) needs scipy/pandas, so its
solve_point() output is taken from the deposit's own operating_window.csv and read on the burner page's JS. This file only exposes JSON-returning helpers for the breeder + reactivity,
plus self_check() which re-derives the breeder frozen design point on load.

No economics anywhere. Conceptual design and simulation study; no machine has been built.
"""
import json
import numpy as np
# Pyodide ships numpy 1.26 (no np.trapezoid); the deposit code uses the numpy-2.0
# name. Alias it so the ACTUAL deposit modules run unmodified in the browser.
if not hasattr(np, "trapezoid"):
    np.trapezoid = np.trapz
import kronos_clean as kc
import dt_evaluator as dte

# ---- frozen breeder design point (= Hyperion_design_point_card.csv, config 22021) ----
BREEDER_FROZEN_INP = dict(fuel="DT", R0=1.2, A=2.5, kappa=2.0, B0=8.0, q95=3.0,
                          fG=0.3, Ti0=15, TBR_dt=1.8, TBR_dd=1.0, H98=1.0,
                          tau_p=2.0, f_he4=0.05)
# recorded headline values the deposit must reproduce
BREEDER_TARGETS = [
    ("Hyperion Q (gain)",        "Q",       3.4239126, 4),
    ("Hyperion P_fus (MW)",      "P_fus_MW", 88.6604,  2),
    ("Hyperion I_p (MA)",        "Ip_MA",    9.8599,   3),
    ("neutron fraction f_n",     "f_n",      0.79712,  4),
    ("net tritium (kg/yr)",      "T_kg_yr",  3.9995,   3),
]


def _round(x, d):
    try:
        return round(float(x), d)
    except Exception:
        return None


def self_check():
    """Re-derive the breeder frozen design point and compare to the recorded card.
    Returns JSON: [ [name, got, want_str, ok], ... ]."""
    got = dte.evaluate(**BREEDER_FROZEN_INP)
    out = []
    for name, key, want, d in BREEDER_TARGETS:
        g = float(got[key])
        ok = abs(g - want) / (abs(want) if want else 1.0) < 5e-4
        out.append([name, _round(g, d), f"{want:.{d}f}", bool(ok)])
    return json.dumps(out)


def breeder_eval(inp_json):
    """Run the deposited breeder evaluator for one slider configuration.
    inp_json: {fuel, Ti0, fG, B0, A, TBR_dt}. Missing keys fall back to frozen."""
    q = dict(BREEDER_FROZEN_INP)
    try:
        u = json.loads(inp_json)
    except Exception:
        u = {}
    for k in ("fuel", "Ti0", "fG", "B0", "A", "TBR_dt", "kappa", "q95", "f_he4"):
        if k in u and u[k] is not None:
            q[k] = u[k]
    r = dte.evaluate(**q)
    keys = ["Q", "P_fus_MW", "P_n_MW", "P_chg_MW", "f_n", "Ip_MA",
            "Ip_driven_MA", "f_bs", "T_kg_yr", "betaN", "tau_E",
            "wall_MW_m2", "B_peak", "P_aux_MW"]
    o = {k: _round(r[k], 4) for k in keys}
    o["on_duty"] = bool(r["on_duty"])
    o["closes_nowall"] = bool(r["on_duty"] and r["beta_ok_nowall"] and r["coil_ok"])
    o["coil_ok"] = bool(r["coil_ok"])
    o["beta_ok_nowall"] = bool(r["beta_ok_nowall"])
    return json.dumps(o)


def reactivity_curves(n=140):
    """Bosch-Hale <sigma v> [m^3/s] vs T for the four fuel channels, from the
    deposited kronos_clean.sigmav. Returns JSON {T, DT, DD, D3He}."""
    T = np.geomspace(1.0, 300.0, n)
    dt = kc.sigmav("DT", T)
    dd = kc.sigmav("DDp", T) + kc.sigmav("DDn", T)   # total D-D
    d3 = kc.sigmav("D3He", T)
    def L(a):
        return [float(x) for x in np.asarray(a, float)]
    return json.dumps(dict(T=L(T), DT=L(dt), DD=L(dd), D3He=L(d3)))
