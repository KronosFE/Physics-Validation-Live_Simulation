"""
kronos_clean.py -- clean-sheet D-D breeder evaluator.

EVERY constant carries its source and units. No value is inherited from any
prior Kronos design. SI units internally unless a symbol name says otherwise
(_keV, _MA, _MW, _m3, _kg_yr).

Sources
-------
[BH92]  Bosch & Hale, Nucl. Fusion 32, 611 (1992) -- reactivity parametrisation.
        DT coefficients re-checked against arXiv:2506.06672 App. A (C7=1.366e-5).
[XIE24] Xie et al., arXiv:2404.11540 -- relativistic e-i + e-e bremsstrahlung
        Gaunt-factor fit, <1% error, Z=1-35, t<=10. Supersedes Rider(1997),
        which XIE24 shows errs >30% for Te>100 keV.
[SAU99] Sauter, Angioni & Lin-Liu, Phys. Plasmas 6, 2834 (1999) -- bootstrap.
[IPB99] ITER Physics Basis, Nucl. Fusion 39, 2175 (1999), ch.2 -- IPB98(y,2).
[ALB01] Albajar, Johner & Granata, Nucl. Fusion 41, 665 (2001) -- synchrotron.
"""
import numpy as np

# ---------------------------------------------------------------- constants
E_CHG   = 1.602176634e-19      # C           exact (SI 2019)
EPS0    = 8.8541878128e-12     # F/m         CODATA 2018
H_PL    = 6.62607015e-34       # J s         exact
M_E     = 9.1093837015e-31     # kg          CODATA 2018
C_LIGHT = 2.99792458e8         # m/s         exact
K_B     = 1.380649e-23         # J/K         exact
MU0     = 4e-7*np.pi           # H/m
MEC2_KEV = M_E*C_LIGHT**2/(E_CHG*1e3)   # 511.0 keV
MEV_J   = 1.602176634e-13      # J per MeV
KEV_J   = 1.602176634e-16      # J per keV
YEAR_S  = 3.15576e7            # s   (Julian year, 365.25 d)
M_T_KG  = 3.01604928*1.66053906660e-27   # kg per triton  (AMU x u)
M_HE3_KG= 3.01602932*1.66053906660e-27   # kg per He-3

# reaction energetics [MeV] -- ENDF/B-VIII.0 Q-values
E_DDP, E_DDN   = 4.03, 3.27      # D(d,p)T ; D(d,n)He3   total Q
E_DT , E_D3HE  = 17.59, 18.35    # T(d,n)He4 ; He3(d,p)He4
EN_DDN, EN_DT  = 2.45, 14.03     # neutron-carried share

# ------------------------------------------------------------ [BH92] fusion
_BH = {
 "DDp":  dict(BG=31.3970, mrc2=937814.0,
              C=[5.65718e-12,3.41267e-3,1.99167e-3,0.0,1.05060e-5,0.0,0.0],
              domain=(0.2,100.0)),
 "DDn":  dict(BG=31.3970, mrc2=937814.0,
              C=[5.43360e-12,5.85778e-3,7.68222e-3,0.0,-2.96400e-6,0.0,0.0],
              domain=(0.2,100.0)),
 "DT":   dict(BG=34.3827, mrc2=1124656.0,
              C=[1.17302e-9,1.51361e-2,7.51886e-2,4.60643e-3,1.35000e-2,
                 -1.06750e-4,1.36600e-5],
              domain=(0.2,100.0)),
 "D3He": dict(BG=68.7508, mrc2=1124656.0,
              C=[5.51036e-10,6.41918e-3,-2.02896e-3,-1.91080e-5,1.35776e-4,0.0,0.0],
              domain=(0.5,190.0)),
}

def sigmav(rx, T_keV, clip_domain=True):
    """[BH92] Maxwellian reactivity -> m^3/s. T_keV may be array.

    The Pade denominator of DDn has a POLE near 965 keV; DT/D3He fits are
    published only to 100/190 keV. Outside the published domain the value is
    held at the endpoint and a companion mask flags it (see sigmav_valid)."""
    p = _BH[rx]; C = p["C"]
    T = np.asarray(T_keV, dtype=float)
    lo, hi = p["domain"]
    Tc = np.clip(T, lo, hi) if clip_domain else T
    num = Tc*(C[1]+Tc*(C[3]+Tc*C[5]))
    den = 1.0+Tc*(C[2]+Tc*(C[4]+Tc*C[6]))
    theta = Tc/(1.0-num/den)
    xi = (p["BG"]**2/(4.0*theta))**(1.0/3.0)
    sv = C[0]*theta*np.sqrt(xi/(p["mrc2"]*Tc**3))*np.exp(-3.0*xi)
    return sv*1e-6                      # cm^3/s -> m^3/s

def sigmav_valid(rx, T_keV):
    lo, hi = _BH[rx]["domain"]
    return (np.asarray(T_keV) >= lo) & (np.asarray(T_keV) <= hi)

# ------------------------------------------------ [XIE24] bremsstrahlung
_CNR = [0.4302, 24.2255e-5, 0.7546e-5, 0.5282, 0.3301, 0.0911]
_CR  = [0.55467, 2.6346, -2.277595, 1.1480, -0.36465, 0.07451,
        -0.00975, 0.0007885, -3.5841e-5, 6.99834e-7]
_CZ  = [5.760e4, 3.440, 16.80, 0.1333]

# P = PREF_BR * ne^2 * sqrt(Te_keV) * [Z*g_ei + g_ee]     W/m^3
# derived from XIE24 eq.(ptotal); reduces to the textbook 5.35e-37 as t->0
PREF_BR = (32*np.pi*E_CHG**6/(3*(4*np.pi*EPS0)**3*H_PL*M_E*C_LIGHT**3)
           * np.sqrt(2*np.pi*K_B/(3*M_E)) * np.sqrt(1e3*E_CHG/K_B))

# XIE24 eq.(geifit1) carries a prefactor c_0 that the paper does not tabulate
# numerically. It is recovered from the paper's OWN electron-energy fit, whose
# analogous term reads (c_nr1 + 1 - 1/c_0) where the thermal fit reads
# (c_nr1 + c_nr6). Hence c_nr6 == 1 - 1/c_0  ->  c_0 = 1/(1-0.0911) = 1.1002.
# Check: this makes g_ei -> 1 as t -> 0, which XIE24 states is the correct
# limit (vs the "incorrect" non-relativistic 2 sqrt(3)/pi = 1.1027).
_C0 = 1.0/(1.0-_CNR[5])          # = 1.10021...

def g_ei(t, Z):
    """[XIE24] electron-ion Gaunt factor. t = Te/(me c^2), valid t<=10."""
    t = np.asarray(t, float); Z = np.asarray(Z, float)
    fnr = (_CNR[0]*(1-np.exp(-(_CNR[1]*Z**2/t)**_CNR[3]))
           - (_CNR[0]+_CNR[5])*np.exp(-(t/(_CNR[2]*Z**2))**_CNR[4]))
    fr  = _C0*sum(_CR[j-1]*t**j for j in range(1, 11))
    u   = 100*t*np.sqrt(10.0/Z)
    fz  = ((Z/10.0)*_CZ[0]*u**_CZ[1])/(np.exp(_CZ[2]*u**_CZ[3])-1.0)
    return _C0*(1.0+fnr-fz)+fr

def g_ee(t):
    """[XIE24] electron-electron Gaunt factor. INDEPENDENT of Z."""
    t = np.asarray(t, float)
    Fee = 0.5*(np.tanh(0.602*(np.log10(t)+5.06))+1)
    FNR = t*6*np.sqrt(3)/(np.sqrt(2)*np.pi)*0.5*(
          np.tanh(-2.153*np.log10(t/0.43))+1)
    return Fee*FNR*(1+0.53*t+9.48*t**2-0.67*t**3+0.027*t**4)

def p_brems(ne, Te_keV, Zeff=1.0):
    """W/m^3.  Zeff multiplies ONLY the e-i term -- the e-e term is a pure
    electron-electron process and carries no Zeff. This is why P_br is NOT
    proportional to Zeff and the ratio does NOT scale as 1/Zeff."""
    t = np.asarray(Te_keV, float)/MEC2_KEV
    return PREF_BR*np.asarray(ne, float)**2*np.sqrt(Te_keV)*(
           Zeff*g_ei(t, Zeff)+g_ee(t))

def p_sync(ne, Te_keV, B_T, a_m, kappa, R0_m, refl=0.8):
    """[ALB01]-form synchrotron loss, W/m^3 (volume-averaged).
    Uses the Cai/Xie system-code reduction P = 4.14e-7 n20^0.5 Te^2.5 B^2.5
    (1-R)^0.5 a_eff^-0.5 (1+2.5Te/511) [W/m^3-equivalent, n in 1e20]."""
    n20 = np.asarray(ne, float)/1e20
    a_eff = a_m*np.sqrt(kappa)
    return (4.14e-7*n20**0.5*np.asarray(Te_keV, float)**2.5*B_T**2.5
            * (1.0-refl)**0.5*a_eff**-0.5*(1.0+2.5*np.asarray(Te_keV,float)/511.0))

# ------------------------------------------------------- [IPB99] confinement
def tau_E_IPB98y2(Ip_MA, B_T, n19, P_MW, R0_m, eps, kappa_a, M_amu=2.0, H=1.0):
    """IPB98(y,2) ELMy H-mode energy confinement time [s].
    tau = 0.0562 H Ip^0.93 B^0.15 P^-0.69 n19^0.41 M^0.19 R^1.97 eps^0.58 ka^0.78
    kappa_a = V/(2 pi^2 R a^2) is the AREAL elongation, not the separatrix value."""
    return (0.0562*H*Ip_MA**0.93*B_T**0.15*P_MW**-0.69*n19**0.41
            * M_amu**0.19*R0_m**1.97*eps**0.58*kappa_a**0.78)

def q95_uckan(R0_m, a_m, B_T, Ip_MA, kappa, delta):
    """[IPB99] ch.1 eq.(6) safety factor at 95% flux surface (ITER convention)."""
    eps = a_m/R0_m
    shape = (1+kappa**2*(1+2*delta**2-1.2*delta**3))/2.0
    return (5.0*a_m**2*B_T/(R0_m*Ip_MA))*shape*(1.17-0.65*eps)/(1-eps**2)**2

def n_greenwald_1e20(Ip_MA, a_m):
    """Greenwald density limit in 1e20 m^-3.  n_G = Ip[MA]/(pi a^2)."""
    return Ip_MA/(np.pi*a_m**2)

# --------------------------------------------------------- [SAU99] bootstrap
def trapped_fraction(eps):
    return 1.0-(1.0-eps)**2/((1.0+1.46*np.sqrt(eps))*np.sqrt(1.0-eps**2))

def _F31(X, Z):
    return ((1+1.4/(Z+1))*X - 1.9/(Z+1)*X**2 + 0.3/(Z+1)*X**3
            + 0.2/(Z+1)*X**4)

def _F32ee(X, Z):
    return ((0.05+0.62*Z)/(Z*(1+0.44*Z))*(X-X**4)
            + 1/(1+0.22*Z)*(X**2-X**4-1.2*(X**3-X**4))
            + 1.2/(1+0.5*Z)*X**4)

def _F32ei(X, Z):
    return (-(0.56+1.93*Z)/(Z*(1+0.44*Z))*(X-X**4)
            + 4.95/(1+2.48*Z)*(X**2-X**4-0.55*(X**3-X**4))
            - 1.2/(1+0.5*Z)*X**4)

def sauter_bootstrap(rho, ne, Te_keV, Ti_keV, ni, R0_m, a_m, B_T, q_prof,
                     Zeff=1.0, kappa=1.0):
    """[SAU99] bootstrap current fraction, flux-surface integrated.

    j_bs(r) = -(1/Bp) [ L31 dp/dr + L32 pe dlnTe/dr + L34 alpha pi dlnTi/dr ]
    -> [Pa/m]/[T] = A/m^2, dimensionally exact.
    Returns (f_bs, Ip_from_q_MA, j_bs profile)."""
    r = rho*a_m
    eps = np.maximum(r/R0_m, 1e-6)
    ft = trapped_fraction(eps)
    Te_eV, Ti_eV = Te_keV*1e3, Ti_keV*1e3

    lnLe = 31.3-np.log(np.sqrt(ne)/Te_eV)
    lnLi = 30.0-np.log(Zeff**3*np.sqrt(ni)/Ti_eV**1.5)
    nue = (6.921e-18*R0_m*q_prof*ne*Zeff*lnLe)/(eps**1.5*Te_eV**2)
    nui = (4.900e-18*R0_m*q_prof*ni*Zeff**4*lnLi)/(eps**1.5*Ti_eV**2)

    X31 = ft/(1+(1-0.1*ft)*np.sqrt(nue)+0.5*(1-ft)*nue/Zeff)
    X32e= ft/(1+0.26*(1-ft)*np.sqrt(nue)+0.18*(1-0.37*ft)*nue/np.sqrt(Zeff))
    X32i= ft/(1+(1+0.6*ft)*np.sqrt(nue)+0.85*(1-0.37*ft)*nue*(1+Zeff))
    X34 = ft/(1+(1-0.1*ft)*np.sqrt(nue)+0.5*(1-0.5*ft)*nue/Zeff)

    L31 = _F31(X31, Zeff)
    L32 = _F32ee(X32e, Zeff)+_F32ei(X32i, Zeff)
    L34 = _F31(X34, Zeff)
    a0  = -1.17*(1-ft)/(1-0.22*ft-0.19*ft**2)
    alpha = ((a0+0.25*(1-ft**2)*np.sqrt(nui))/(1+0.5*np.sqrt(nui))
             + 0.315*nui**2*ft**6)/(1+0.15*nui**2*ft**6)

    pe = ne*Te_keV*KEV_J
    pi_ = ni*Ti_keV*KEV_J
    p   = pe+pi_
    d = lambda y: np.gradient(y, r)
    Bp = MU0*_enclosed_current(r, q_prof, R0_m, B_T, kappa)/(2*np.pi*r*_kappa_perim(kappa))
    Bp = np.where(r > 0, Bp, np.nan)

    jbs = -(1.0/Bp)*(L31*d(p) + L32*pe*d(np.log(Te_keV))
                     + L34*alpha*pi_*d(np.log(Ti_keV)))
    jbs = np.nan_to_num(jbs)
    area_el = 2*np.pi*r*kappa
    I_bs = np.trapz(jbs*area_el, r)
    I_tot = _enclosed_current(r, q_prof, R0_m, B_T, kappa)[-1]
    return I_bs/I_tot, I_tot/1e6, jbs

def _kappa_perim(kappa):
    """Elongated-perimeter correction: P_pol/(2 pi a) ~ sqrt((1+kappa^2)/2).
    THIS IS THE TERM THAT WAS MISSING IN THE EARLIER POLOIDAL PERIMETER."""
    return np.sqrt((1.0+kappa**2)/2.0)

def _enclosed_current(r, q, R0, B0, kappa):
    """I(r) from q(r) = 2 pi r^2 B0 kappa /(mu0 R0 I(r)) (elongated, circularised)."""
    return 2*np.pi*r**2*B0*kappa/(MU0*R0*np.maximum(q, 1e-3))

# ------------------------------------------------------------- profiles
def parab(rho, y0, ysep_frac, alpha):
    return y0*((1-ysep_frac)*(1-rho**2)**alpha + ysep_frac)

def vol_avg(rho, y, kappa, R0, a):
    """Volume average over an elongated torus. dV = 4 pi^2 R0 kappa a^2 rho drho."""
    w = rho
    return np.trapz(y*w, rho)/np.trapz(w, rho)

def plasma_volume(R0, a, kappa):
    return 2*np.pi*R0*np.pi*a**2*kappa
