

// Mock BlackScholes class to avoid import issues
class BlackScholes {
    static calculate(params: any, type: 'call' | 'put'): any {
        const { S, K, t, sigma, r, q = 0 } = params;
        const safeT = Math.max(t, 1e-4);
        const safeSigma = Math.max(sigma, 1e-4);
        const sqrtT = Math.sqrt(safeT);
        const d1 = (Math.log(S / K) + (r - q + 0.5 * safeSigma * safeSigma) * safeT) / (safeSigma * sqrtT);
        const d2 = d1 - safeSigma * sqrtT;

        const N = (x: number) => {
            const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
            const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
            const sign = x < 0 ? -1 : 1;
            const z = Math.abs(x) / Math.sqrt(2.0);
            const t = 1.0 / (1.0 + p * z);
            const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
            return 0.5 * (1.0 + sign * erf);
        };

        const nd1 = N(d1);
        const nd2 = N(d2);
        const e_qt = Math.exp(-q * safeT);
        const e_rt = Math.exp(-r * safeT);

        let price = 0;
        if (type === 'call') {
            price = S * e_qt * nd1 - K * e_rt * nd2;
        } else {
            const nd1_minus = N(-d1);
            const nd2_minus = N(-d2);
            price = K * e_rt * nd2_minus - S * e_qt * nd1_minus;
        }
        return { price };
    }
}

const params = {
    S: 53.87,
    K: 54,
    sigma: 0.4038,
    r: 0.03741,
    t: 0,
    type: 'call' as const
};


console.log("=== Debugging Pricing Discrepancy ===");
console.log(`Params: S=${params.S}, K=${params.K}, sigma=${params.sigma}, r=${params.r}`);

// Target Prices
const TARGET_MINE = 1.8770;
const TARGET_THEIRS = 1.6212;

// Check common T values
const conversions = [
    { label: "12 days / 252", t: 12 / 252 },
    { label: "12 days / 365", t: 12 / 365 },
    { label: "8 days / 252", t: 8 / 252 }, // ~12 calendar days minus weekends
    { label: "9 days / 252", t: 9 / 252 },
    { label: "13 days / 252", t: 13 / 252 },
    { label: "30 days / 252", t: 30 / 252 },
];

conversions.forEach(c => {
    const p = { ...params, t: c.t };
    const res = BlackScholes.calculate(p, 'call');
    const resPut = BlackScholes.calculate(p, 'put');
    console.log(`[${c.label}] T=${c.t.toFixed(4)} => Call: ${res.price.toFixed(4)}, Put: ${resPut.price.toFixed(4)}`);
});

// Binary search for T matching TARGET_MINE (1.8770)
let low = 0, high = 1.0;
for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const res = BlackScholes.calculate({ ...params, t: mid }, 'call');
    if (res.price < TARGET_MINE) low = mid;
    else high = mid;
}
const t_mine = (low + high) / 2;
console.log(`\nReversed T for 1.8770: ${t_mine.toFixed(5)} (~${(t_mine * 252).toFixed(2)} trading days / ~${(t_mine * 365).toFixed(2)} calendar days)`);

// Binary search for T matching TARGET_THEIRS (1.6212)
low = 0; high = 1.0;
for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const res = BlackScholes.calculate({ ...params, t: mid }, 'call');
    if (res.price < TARGET_THEIRS) low = mid;
    else high = mid;
}
const t_theirs = (low + high) / 2;
console.log(`Reversed T for 1.6212: ${t_theirs.toFixed(5)} (~${(t_theirs * 252).toFixed(2)} trading days / ~${(t_theirs * 365).toFixed(2)} calendar days)`);
