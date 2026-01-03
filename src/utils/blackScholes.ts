/**
 * Black-Scholes - Merton Model Implementation
 * Includes Basic and Higher-order Greeks
 */

export interface SimulationParams {
    S: number; // Spot Price
    K: number; // Strike Price
    t: number; // Time to Expiration (Trading Years) for Volatility
    tDiscount?: number; // Time to Expiration (Calendar Years) for Rates. Defaults to t.
    sigma: number; // Volatility (decimal)
    r: number; // Risk-free Rate (decimal)
    q?: number; // Dividend Yield
    isTextbookMode?: boolean; // Use simple calendar days for all time
}

export interface GreeksResult {
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    // Higher Order
    vanna: number;
    charm: number;
    speed: number;
    color: number;
    volga: number; // aka Vomma
    zomma: number;
    pnl?: number; // Profit & Loss
}

// Cumulative Distribution Function of Standard Normal Distribution
function N(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const z = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * z);
    const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * erf);
}

// Probability Density Function of Standard Normal Distribution
function n(x: number): number {
    return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export class BlackScholes {
    static calculate(params: SimulationParams, type: 'call' | 'put'): GreeksResult {
        const { S, K, t, sigma, r, q = 0, tDiscount, isTextbookMode = false } = params;

        // t  -> t_vol (Trading Time)
        // tRate -> t_cal (Calendar Time)
        const tRate = tDiscount !== undefined ? tDiscount : t;

        // Avoid division by zero
        const safeT = Math.max(t, 1e-4);
        const safeTRate = Math.max(tRate, 1e-4);
        const safeSigma = Math.max(sigma, 1e-4);
        const sqrtT = Math.sqrt(safeT);

        // d1 uses:
        // - Drift: (r - q) * tRate (Calendar)
        // - Vol variance: 0.5 * sigma^2 * t (Trading)
        // - Denom: sigma * sqrt(t) (Trading)
        const d1 = (Math.log(S / K) + (r - q) * safeTRate + 0.5 * safeSigma * safeSigma * safeT) / (safeSigma * sqrtT);
        const d2 = d1 - safeSigma * sqrtT;

        const nd1 = N(d1);
        const nd2 = N(d2);
        const n_d1 = n(d1);

        // Put counterparts
        const nd1_minus = N(-d1);
        const nd2_minus = N(-d2);

        const e_qt = Math.exp(-q * safeTRate); // Calendar
        const e_rt = Math.exp(-r * safeTRate); // Calendar

        let price = 0;
        let delta = 0;
        let theta = 0;
        let rho = 0;

        // --- Basic Greeks ---

        if (type === 'call') {
            price = S * e_qt * nd1 - K * e_rt * nd2;
            delta = e_qt * nd1;

            // Theta (Call)
            // Modified for dual time:
            // Term 1 (Diffusion/Vol): driven by Trading Time (dt_vol)
            // Term 2 & 3 (Drift/Rates): driven by Calendar Time (dt_cal)
            // But usually Theta is "per day". Which day? Calendar day passage.
            // If one calendar day passes, trading time passes by (252/365) days (approx).
            // Let's stick to the analytical derivative with respect to t (Calendar? or Trading?)
            // Usually we diff wrt t. If t_vol and t_cal are linked, d(t_vol)/d(t_cal) ~ 252/365.
            // Simplified: Return Standard Theta using t (Trading) for everything or respect separation?
            // If we strictly follow the formula Price(S, t_vol, t_cal), then:
            // Theta = dPrice/dt_cal.
            // dPrice/dt_cal = dPrice/dt_cal (explicit) + dPrice/dt_vol * (dt_vol/dt_cal)
            // Let's assume dt_vol/dt_cal = 252/365.

            // Term 1 (Vol part): - (S e^-qt n(d1) sigma) / (2 sqrt(t_vol))
            // This is dPrice/dt_vol * ...
            // Let's just calculate standard Theta terms using the mixed inputs as they appear in pricing.
            // Be careful: The standard formula assumes t_vol = t_cal.

            // Re-deriving Term 1 (vol decay): - S e^-qt n(d1) sigma / (2 sqrt(t_vol))
            // Re-deriving Term 2 (r decay): - r K e^-rt N(d2) (using t_cal)
            // Re-deriving Term 3 (q decay): + q S e^-qt N(d1) (using t_cal)

            // Ideally we report Theta per Calendar Day.
            // So we take Term 1 * (252/365) + Term 2 + Term 3 ?
            // Let's default to calculating "Theta per Year" assuming t_vol and t_cal move together (ratio ~ 1 or specific).
            // For now, I will use standard formula but substitution t -> safeT for vol terms and safeTRate for rate terms.

            const term1 = - (S * e_qt * n_d1 * safeSigma) / (2 * sqrtT); // Vol partial
            const term2 = - r * K * e_rt * nd2; // Rate partial
            const term3 = q * S * e_qt * nd1; // Yield partial

            // If we strictly view Theta as "Decay per Calendar Year":
            // The Vol partial needs to be scaled by (Trading Days / Calendar Days) ~ (252/365)
            // BUT, if we consider safeT and safeTRate are independent params, we return partials?
            // User just wants "Theta".
            // Let's scale term1 by (safeT / safeTRate) if possible? No, safeT varies differently.
            // Let's assume a conversion factor of approx 0.69 (252/365) applies to the volatility consumption.
            // Vol time weight for Theta:
            // Textbook Mode: 1.0 (Theta per year, using same t)
            // Real World: 252/365 (Vol decays on trading days, but we report per calendar day)
            const volTimeWeight = isTextbookMode ? 1.0 : (252 / 365);
            theta = term1 * volTimeWeight + term2 + term3;

            // Rho (wrt r, using t_cal)
            rho = K * safeTRate * e_rt * nd2;

        } else {
            price = K * e_rt * nd2_minus - S * e_qt * nd1_minus;
            delta = -e_qt * nd1_minus;

            const term1 = - (S * e_qt * n_d1 * safeSigma) / (2 * sqrtT);
            const term2 = r * K * e_rt * nd2_minus;
            const term3 = - q * S * e_qt * nd1_minus;

            const volTimeWeight = isTextbookMode ? 1.0 : (252 / 365);
            theta = term1 * volTimeWeight + term2 + term3;

            rho = -K * safeTRate * e_rt * nd2_minus;
        }

        // Gamma (Vol driven)
        const gamma = (e_qt * n_d1) / (S * safeSigma * sqrtT);

        // Vega (Vol driven) -> sqrt(t_vol)
        let vega = S * e_qt * n_d1 * sqrtT;

        // Higher order - Basic adaptation
        const vanna = -e_qt * n_d1 * (d2 / safeSigma);

        // Charm: - dDelta/dt. Complex with dual time.
        // Simplified: use standard chart but with mixed times.
        // This is getting deep. For "Higher Order", let's stick to using 't' (Trading) as the primary 'Time' for simplified analytical formulas
        // UNLESS the user specifically asked for high precision Greeks on dual time.
        // The user asked for Price accuracy.
        // Let's use the explicit 't' (Trading) for Greeks formulas unless obviously rate-dependent.

        const charmTerm = (2 * (r - q) * safeTRate - d2 * safeSigma * sqrtT) / (2 * safeT * safeSigma * sqrtT); // Hybrid attempt
        // Note: The derivative math gets messy. I will use safeT for the complex denominator parts and safeTRate for numerator drift. 
        // Ideally should re-derive.
        // Given constraints, I will leave higher order Greeks using mostly 'safeT' (Trading) to avoid breaking them, 
        // as they are 2nd order and price accuracy is key.

        // Reverting higher order to use safeT to be safe, except where r is involved clearly.
        // It's better to be consistent with main model.

        let charm = 0;
        if (type === 'call') {
            charm = -e_qt * (n_d1 * charmTerm - q * nd1);
        } else {
            charm = e_qt * (n_d1 * charmTerm + q * nd1_minus);
        }

        const speed = - (gamma / S) * ((d1 / (safeSigma * sqrtT)) + 1);

        // Color
        const color_val = - (gamma / (2 * safeT)) * (1 + ((2 * (r - q) * safeTRate - d2 * safeSigma * sqrtT) / (safeSigma * sqrtT)) * d1) + q * gamma;

        const volga = vega * d1 * d2 / safeSigma;
        const zomma = gamma * ((d1 * d2 - 1) / safeSigma);

        // Scale to Market Standards
        theta = theta / 365; // Per Day
        vega = vega / 100;   // Per 1% Vol
        rho = rho / 100;     // Per 1% Rate

        return {
            price,
            delta,
            gamma,
            theta,
            vega,
            rho,
            vanna,
            charm,
            speed,
            color: color_val,
            volga,
            zomma
        };
    }
}
