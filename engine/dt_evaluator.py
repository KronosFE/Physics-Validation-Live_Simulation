"""
dt_evaluator.py -- D-T / catalysed-D-D / D-D breeder re-derivation.

Built ON TOP of kronos_clean.py (its reactivity, bremsstrahlung, IPB98, Uckan-q95
and Sauter kernels are reused verbatim). Every DEPARTURE from kronos_clean is
listed here explicitly with its reason, so no correction is silent.

DEPARTURES FROM kronos_clean.py (each is a defect found, not a preference)
-------------------------------------------------------------------------
X1  CURRENT DEFINITION UNIFIED. kronos_clean carries TWO plasma currents that
    disagree by 3.06x at the D1 design point: q95_uckan() -> 40.93 MA and
    _enclosed_current() (circularised, used INSIDE sauter_bootstrap) -> 13.37 MA.
    sauter_bootstrap therefore returns I_bs/I_circ, not I_bs/I_p, and OVERSTATES
    the bootstrap fraction by that same 3.06x. Here Bp and f_bs are both built
    from the Uckan Ip, which is the one the scan reported.
X2  SYNCHROTRON UNITS. kronos_clean.p_sync docstring says W/m^3; the coefficient
    is MW/m^3 (the original scan read it as MW/m^3, so the scan is self-consistent
    -- the docstring is a latent 1e6 trap, not an active scan error). Kept as
    MW/m^3 and renormalised: as written it gives 1.52 MW on the ITER test point
    where the corpus canon (Kukushkin-Minashin generalised Trubnikov) gives 9.9 MW,
    so it UNDER-charges 6.5x. SYNC_CAL = 6.51 applied, switchable.
X3  BLANKET TBR IS FUEL-DEPENDENT AND CAPPED BY NEUTRON ENERGY. The corpus's own
    Monte-Carlo slab transport (blanket_tbr_scan.csv, E0 = 2.45e6 eV) reaches
    TBR_torus = 0.9998 MAXIMUM over 48 material/enrichment/thickness corners --
    it is structurally <= 1 because 2.45 MeV is below any useful (n,2n)
    multiplication threshold (Pb(n,2n) ~7.4 MeV; Be(n,2n) open at 2.45 MeV but
    with negligible cross-section). 14 MeV D-T neutrons DO support multiplication,
    which is why TBR 1.1-1.8 is available to D-T and NOT to D-D.
X4  TRITIUM BOOKKEEPING IS PER-BRANCH AND PER-CHANNEL (defect class E3). Tritons
    are counted from: the DDp branch DIRECTLY (born in plasma), the DDn 2.45 MeV
    neutron via the blanket, and the DT 14 MeV neutron via the blanket, MINUS the
    tritons burned. Branching is taken from the reactivities at temperature, never
    assumed 50/50.
X5  PEAK TF FIELD IS CHARGED. B0 is not free: B_TF ~ 1/R, so the inboard
    conductor sees B0*R0/R_cp. At A = 1.8 the centre post is thin and this is the
    binding build constraint on high field. Compared against the highest field
    ever reached on a fusion-scale coil (20.1 T on-conductor, SPARC TFMC,
    Hartwig 2023) -- from this corpus's own literature table.

SOURCES ADDED BEYOND kronos_clean
---------------------------------
[SAB10] Sabbagh et al., Nucl. Fusion 50, 025020 (2010) -- NSTX: beta collapse at
        betaN = 4.2 at the no-wall limit; betaN > 5.5 sustained WITH active n=1
        RWM control. MEASURED, device named. This is the ST beta_N ceiling used.
[GRY98] Gryaznevich et al., PRL 80, 3972 (1998) -- START, beta_t >= 30%, betaN >= 4.
[HAR23] Hartwig et al., IEEE TAS (2023) 10.1109/tasc.2023.3332613 -- 20.1 T peak
        on-conductor on a ~3 m fusion-scale REBCO TF coil (SPARC TFMC).
[KX10]  This corpus, deposit/zenodo_deposit/paper3/KX10_neutronics.py line 42:
        DPA_PER_MWyr = 10.0 dpa per MW*yr/m^2 of fusion neutrons (steel).
"""
import numpy as np
import kronos_clean as kc

# ------------------------------------------------------------------ switches
SYNC_CAL      = 6.51    # X2: ITER recalibration of p_sync (9.9/1.52). 1.0 = kronos_clean as-is
BETAN_NOWALL  = 4.2     # [SAB10] NSTX sustained no-wall collapse -- primary ceiling
BETAN_RWM     = 5.5     # [SAB10] NSTX sustained WITH active n=1 RWM control
B_COIL_DEMO   = 20.1    # [HAR23] highest on-conductor field at fusion scale
INBOARD_BUILD = 0.15    # m, ST-typical inboard gap+shield (no inboard blanket)
DPA_PER_MWYR  = 10.0    # [KX10] steel dpa per MW*yr/m^2
DUTY_LO, DUTY_HI = 1.87, 4.0   # kg T/yr -- REQUIREMENT row, never relabelled

# neutron-carried energy share per branch [MeV] (ENDF/B-VIII.0 Q-values)
EN_DDN, EN_DT = 2.45, 14.03
E_DDP, E_DDN, E_DT, E_D3HE = 4.03, 3.27, 17.59, 18.35

RHO = np.linspace(1e-3, 1.0, 161)


# ------------------------------------------------------------ geometry/current
def geom(R0, A, kappa, B0, q95, delta=0.4):
    """delta = 0.4 recovered by inversion from the original scan (row 912
    reproduces Ip = 40.933 MA to 5 figures at delta = 0.4)."""
    a = R0 / A
    eps = a / R0
    Ip = _ip_from_q95(R0, a, B0, q95, kappa, delta)
    R_cp = R0 - a - INBOARD_BUILD
    B_peak = B0 * R0 / R_cp if R_cp > 0 else np.inf
    L_pol = 2 * np.pi * a * kc._kappa_perim(kappa)
    return dict(a=a, eps=eps, Ip_MA=Ip, R_cp=R_cp, B_peak=B_peak, L_pol=L_pol,
                V_m3=kc.plasma_volume(R0, a, kappa), delta=delta)


def _ip_from_q95(R0, a, B0, q95, kappa, delta):
    """Invert kc.q95_uckan analytically (it is linear in 1/Ip)."""
    eps = a / R0
    shape = (1 + kappa**2 * (1 + 2*delta**2 - 1.2*delta**3)) / 2.0
    return (5.0 * a**2 * B0 / (R0 * q95)) * shape * (1.17 - 0.65*eps) / (1 - eps**2)**2


# ------------------------------------------------------------------ fuel mixes
def ion_mix(fuel, ne, f_he4=0.0, f_he3_ash=0.0):
    """Return dict of ion densities [m^-3] and Zeff, given electron density.

    Quasineutrality: ne = sum_j Z_j n_j. Helium ash carries Z = 2, so it
    DILUTES the fuel twice over (once by displacing fuel ions, once through
    the electrons it contributes) -- the squared dilution the canon flags.
    f_he4 / f_he3_ash are ash fractions OF THE ELECTRON DENSITY.
    """
    n_he4 = f_he4 * ne
    n_he3 = f_he3_ash * ne
    ne_fuel = ne - 2*n_he4 - 2*n_he3          # electrons left for Z=1 fuel
    ne_fuel = max(ne_fuel, 0.0) if np.isscalar(ne_fuel) else np.maximum(ne_fuel, 0.0)
    if fuel == "DD":
        nD, nT = ne_fuel, 0.0
    elif fuel == "DT":
        nD = nT = 0.5 * ne_fuel
    elif fuel == "catDD":
        nD, nT = ne_fuel, 0.0                 # T/He3 recycled, held at trace
    else:
        raise ValueError(fuel)
    n_ion = nD + nT + n_he4 + n_he3
    Zeff = (nD + nT + 4*n_he4 + 4*n_he3) / np.maximum(n_ion, 1e-30)
    return dict(nD=nD, nT=nT, n_he4=n_he4, n_he3=n_he3, n_ion=n_ion, Zeff=Zeff)


def reaction_rates(fuel, mix, T_keV):
    """Volumetric reaction rates [reactions/m^3/s] per branch, at temperature.

    Branching is NEVER assumed: R_DDp/R_DDn comes from the reactivities.
    For catalysed D-D the bred T and He3 are burned in situ, so DT and D3He
    proceed AT THE RATE THEY ARE PRODUCED (perfect catalysis -- an upper bound,
    flagged as such).
    """
    nD, nT = mix["nD"], mix["nT"]
    svp, svn = kc.sigmav("DDp", T_keV), kc.sigmav("DDn", T_keV)
    R_DDp = 0.5 * nD**2 * svp
    R_DDn = 0.5 * nD**2 * svn
    if fuel == "DT":
        R_DT = nD * nT * kc.sigmav("DT", T_keV)
        R_D3He = np.zeros_like(np.asarray(R_DT, float))
    elif fuel == "catDD":
        R_DT = R_DDp.copy()      # every bred triton burns
        R_D3He = R_DDn.copy()    # every bred He-3 burns
    else:
        R_DT = np.zeros_like(np.asarray(R_DDp, float))
        R_D3He = np.zeros_like(np.asarray(R_DDp, float))
    return R_DDp, R_DDn, R_DT, R_D3He


def power_density(R_DDp, R_DDn, R_DT, R_D3He):
    """Total and neutron-carried fusion power density [W/m^3].

    E3 guard: each branch is multiplied by ITS OWN Q-value, and the neutron
    share by ITS OWN neutron energy. No total is ever divided by one product's
    energy.
    """
    p_tot = (R_DDp*E_DDP + R_DDn*E_DDN + R_DT*E_DT + R_D3He*E_D3HE) * kc.MEV_J
    p_n = (R_DDn*EN_DDN + R_DT*EN_DT) * kc.MEV_J
    return p_tot, p_n


# ------------------------------------------------------------------- tritium
M_T_KG = 3.01604928 * 1.66053906660e-27
YEAR_S = 3.15576e7


def tritium_rate(R_DDp, R_DDn, R_DT, V_m3, TBR_dd, TBR_dt, f_burn_direct, cf=1.0):
    """NET saleable tritium [kg/yr]. Volume-integrated, per channel.

    Channels, each with its OWN neutron energy and its OWN TBR:
      + DDp branch          -> a triton DIRECTLY, born in the plasma.
                               A fraction f_burn_direct of these burn in situ
                               and CANNOT BE SOLD (the corpus's own structural
                               finding: bred T that burns cannot be sold).
      + DDn 2.45 MeV neutron -> blanket, TBR_dd <= ~1.0 (X3, no multiplication)
      + DT  14   MeV neutron -> blanket, TBR_dt up to 1.8 (multiplication open)
      - DT burn              -> consumes one triton per reaction

    D9 guard: the capacity factor cf multiplies the ANNUAL RATE ONCE, at the
    end. It is never applied to a numerator where it would fail to cancel.
    """
    trit_per_s = (R_DDp * (1.0 - f_burn_direct)
                  + TBR_dd * R_DDn
                  + TBR_dt * R_DT
                  - R_DT) * V_m3
    return trit_per_s * M_T_KG * YEAR_S * cf


def burn_fraction_direct(nD, T_keV, tau_p):
    """Fraction of plasma-born (DDp) tritons that burn before they are pumped.
    Steady state: n_T/tau_p + n_T nD <sv>DT = S_T  ->  f_burn = 1/(1 + 1/(tau_p nD <sv>DT)).
    """
    rate = nD * kc.sigmav("DT", T_keV)
    return (tau_p * rate) / (1.0 + tau_p * rate)


# ---------------------------------------------------------------- bootstrap
def bootstrap(R0, a, kappa, B0, Ip_MA, q95, ne_p, Te_p, Ti_p, ni_p, Zeff, L_pol):
    """Bootstrap fraction, TWO independent estimates, both against the SAME Ip.

    (a) Sauter kernel [SAU99], with Bp built from the Uckan Ip (X1 fix).
    (b) f_bs = c_bs sqrt(eps) beta_p, the standard scaling, c_bs in [0.7, 1.2].

    Returns (f_bs_sauter, f_bs_lo, f_bs_hi, beta_p). All capped at 1.0 -- a
    bootstrap fraction above unity is not physical for a steady-state tokamak
    and would be a sign the profiles are outside the fit's validity.
    """
    r = RHO * a
    eps_r = np.maximum(r / R0, 1e-6)
    Ip_A = Ip_MA * 1e6
    # enclosed current from a monotone q profile, RENORMALISED so I(a) = Ip
    q_prof = 1.0 + (q95 - 1.0) * RHO**2
    I_shape = RHO**2 / np.maximum(q_prof, 1e-3)
    I_encl = Ip_A * I_shape / I_shape[-1]
    Bp = kc.MU0 * I_encl / (L_pol * RHO)          # <Bp> at each radius
    Bp = np.where(RHO > 0, Bp, np.nan)

    ft = kc.trapped_fraction(eps_r)
    Te_eV, Ti_eV = Te_p*1e3, Ti_p*1e3
    lnLe = 31.3 - np.log(np.sqrt(ne_p)/Te_eV)
    lnLi = 30.0 - np.log(Zeff**3*np.sqrt(ni_p)/Ti_eV**1.5)
    nue = (6.921e-18*R0*q_prof*ne_p*Zeff*lnLe)/(eps_r**1.5*Te_eV**2)
    nui = (4.900e-18*R0*q_prof*ni_p*Zeff**4*lnLi)/(eps_r**1.5*Ti_eV**2)

    X31 = ft/(1+(1-0.1*ft)*np.sqrt(nue)+0.5*(1-ft)*nue/Zeff)
    X32e = ft/(1+0.26*(1-ft)*np.sqrt(nue)+0.18*(1-0.37*ft)*nue/np.sqrt(Zeff))
    X32i = ft/(1+(1+0.6*ft)*np.sqrt(nue)+0.85*(1-0.37*ft)*nue*(1+Zeff))
    X34 = ft/(1+(1-0.1*ft)*np.sqrt(nue)+0.5*(1-0.5*ft)*nue/Zeff)
    L31 = kc._F31(X31, Zeff)
    L32 = kc._F32ee(X32e, Zeff) + kc._F32ei(X32i, Zeff)
    L34 = kc._F31(X34, Zeff)
    a0 = -1.17*(1-ft)/(1-0.22*ft-0.19*ft**2)
    alpha = ((a0+0.25*(1-ft**2)*np.sqrt(nui))/(1+0.5*np.sqrt(nui))
             + 0.315*nui**2*ft**6)/(1+0.15*nui**2*ft**6)

    pe = ne_p*Te_p*kc.KEV_J
    pi_ = ni_p*Ti_p*kc.KEV_J
    p = pe+pi_
    d = lambda y: np.gradient(y, r)
    jbs = -(1.0/Bp)*(L31*d(p) + L32*pe*d(np.log(Te_p)) + L34*alpha*pi_*d(np.log(Ti_p)))
    jbs = np.nan_to_num(jbs)
    I_bs = np.trapezoid(jbs*(2*np.pi*r*kappa), r)
    f_sauter = float(np.clip(I_bs/Ip_A, 0.0, 1.0))

    p_bar = np.trapezoid(p*RHO, RHO)/np.trapezoid(RHO, RHO)
    Bp_bar = kc.MU0*Ip_A/L_pol
    beta_p = 2*kc.MU0*p_bar/Bp_bar**2
    eps = a/R0
    f_lo = float(np.clip(0.7*np.sqrt(eps)*beta_p, 0, 1))
    f_hi = float(np.clip(1.2*np.sqrt(eps)*beta_p, 0, 1))
    return f_sauter, f_lo, f_hi, beta_p


# --------------------------------------------------------------- full solve
def evaluate(fuel, R0, A, kappa, B0, q95, fG, Ti0, TBR_dt, TBR_dd=1.0,
             H98=1.0, tau_p=2.0, alphaT=1.0, alphaN=0.0, f_he4=0.0,
             sync_cal=None, cf=1.0):
    """One configuration -> one row. Nothing is frozen; every field is computed."""
    sync_cal = SYNC_CAL if sync_cal is None else sync_cal
    g = geom(R0, A, kappa, B0, q95)
    a, Ip, V = g["a"], g["Ip_MA"], g["V_m3"]

    nG20 = kc.n_greenwald_1e20(Ip, a)
    ne_bar = fG * nG20 * 1e20

    # profiles, normalised so the volume average is the stated mean
    # T_sep/T_0 = 0.02: a zero-temperature edge makes the XIE24 Gaunt fit NaN
    # (log10(t->0)); 2% is well inside any real separatrix and changes the
    # volume average by <1%.
    Tp = kc.parab(RHO, Ti0, 0.02, alphaT)
    nsh = kc.parab(RHO, 1.0, 0.0, alphaN)
    nsh = nsh / (np.trapezoid(nsh*RHO, RHO)/np.trapezoid(RHO, RHO))
    ne_p = ne_bar * nsh

    mix = ion_mix(fuel, ne_p, f_he4=f_he4)
    Zeff_p = mix["Zeff"]
    Zeff = float(np.trapezoid(Zeff_p*RHO, RHO)/np.trapezoid(RHO, RHO))

    R_DDp, R_DDn, R_DT, R_D3He = reaction_rates(fuel, mix, Tp)
    p_fus, p_n = power_density(R_DDp, R_DDn, R_DT, R_D3He)
    va = lambda y: float(np.trapezoid(np.asarray(y, float)*RHO, RHO)
                         / np.trapezoid(RHO, RHO))
    P_fus = va(p_fus)*V/1e6
    P_n = va(p_n)*V/1e6
    f_n = P_n/P_fus if P_fus > 0 else np.nan

    P_br = va(kc.p_brems(ne_p, Tp, Zeff_p))*V/1e6
    P_sy = va(kc.p_sync(ne_p, Tp, B0, a, kappa, R0))*V*sync_cal   # X2: MW/m^3
    P_rad = P_br + P_sy
    P_chg = P_fus - P_n

    # ---- confinement: invert IPB98(y,2) for the auxiliary power it demands
    n19 = ne_bar/1e19
    kappa_a = kappa
    W_of_P = lambda P: (kc.tau_E_IPB98y2(Ip, B0, n19, P, R0, g["eps"], kappa_a,
                                         M_amu=2.5 if fuel == "DT" else 2.0, H=H98) * P)
    # steady state: W/tau_E = P_heat = P_chg + P_aux  (radiation inside tau_E)
    W_th = 1.5 * va(2*ne_p*Tp*kc.KEV_J) * V / 1e6      # MJ
    lo, hi = 1e-3, 1e5
    for _ in range(200):
        mid = np.sqrt(lo*hi)
        if W_of_P(mid) < W_th: lo = mid
        else: hi = mid
    P_heat = np.sqrt(lo*hi)
    P_aux = max(P_heat - P_chg, 0.0)
    tau_E = kc.tau_E_IPB98y2(Ip, B0, n19, P_heat, R0, g["eps"], kappa_a,
                             M_amu=2.5 if fuel == "DT" else 2.0, H=H98)
    Q = P_fus/P_aux if P_aux > 0 else np.inf

    # ---- beta_N from the ACTUAL kinetic pressure
    p_bar = va(2*ne_p*Tp*kc.KEV_J)
    beta_t = 2*kc.MU0*p_bar/B0**2
    betaN = beta_t*100*a*B0/Ip

    # ---- bootstrap / driven decomposition
    ni_p = mix["n_ion"]
    f_sau, f_lo, f_hi, beta_p = bootstrap(R0, a, kappa, B0, Ip, q95,
                                         ne_p, Tp, Tp, ni_p, Zeff, g["L_pol"])
    Ip_driven = Ip*(1.0-f_sau)
    Ip_driven_lo = Ip*(1.0-f_hi)
    Ip_driven_hi = Ip*(1.0-f_lo)

    # ---- tritium
    # f_burn_direct applies ONLY to pure D-D, where in-situ triton burn is
    # modelled implicitly (R_DT = 0 by construction). For catDD and DT the burn
    # is EXPLICIT as R_DT and is subtracted in tritium_rate -- applying fbd there
    # too would subtract the same burn twice.
    fbd = va(burn_fraction_direct(mix["nD"], Tp, tau_p)) if fuel == "DD" else 0.0
    T_kg = tritium_rate(R_DDp, R_DDn, R_DT, V, TBR_dd, TBR_dt, fbd, cf=cf) \
        if not np.isscalar(R_DDp) else np.nan
    T_kg = float(va(R_DDp*(1-fbd) + TBR_dd*R_DDn + TBR_dt*R_DT - R_DT)
                 * V * M_T_KG * YEAR_S * cf)

    # ---- wall load and damage
    A_wall = 4*np.pi**2*R0*a*kc._kappa_perim(kappa)/np.pi*np.pi   # ~ 2pi R * L_pol
    A_wall = 2*np.pi*R0*g["L_pol"]
    wall = P_n/A_wall
    dpa = wall*DPA_PER_MWYR

    return dict(fuel=fuel, TBR_dt=TBR_dt, TBR_dd=TBR_dd, B0=B0, R0=R0, A=A,
                a=a, kappa=kappa, q95=q95, fG=fG, Ti0=Ti0, H98=H98, tau_p=tau_p,
                B_peak=g["B_peak"], R_cp=g["R_cp"], V_m3=V, ne_bar=ne_bar,
                nG20=nG20, Zeff=Zeff, P_fus_MW=P_fus, P_n_MW=P_n, f_n=f_n,
                P_br_MW=P_br, P_sync_MW=P_sy, P_rad_MW=P_rad, P_chg_MW=P_chg,
                P_aux_MW=P_aux, tau_E=tau_E, W_MJ=W_th, Q=Q, betaN=betaN,
                beta_t=beta_t, beta_p=beta_p, Ip_MA=Ip, f_bs=f_sau,
                f_bs_lo=f_lo, f_bs_hi=f_hi, Ip_driven_MA=Ip_driven,
                Ip_driven_lo=Ip_driven_lo, Ip_driven_hi=Ip_driven_hi,
                f_T_burn_direct=fbd, T_kg_yr=T_kg, wall_MW_m2=wall,
                dpa_per_fpy=dpa,
                on_duty=bool(DUTY_LO <= T_kg <= DUTY_HI),
                beta_ok_nowall=bool(betaN < BETAN_NOWALL),
                beta_ok_rwm=bool(betaN < BETAN_RWM),
                coil_ok=bool(g["B_peak"] <= B_COIL_DEMO),
                density_ok=bool(fG <= 1.0))
