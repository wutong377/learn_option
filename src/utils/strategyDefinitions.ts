import { OptionParams, LegDefinition } from '../types';

export function getStrategyLegs(params: OptionParams): LegDefinition[] {
    const s = params.strategy || 'single';
    const mainType = params.type; // 'call' or 'put'
    const dir = mainType === 'call' ? 1 : -1; // This 'dir' logic in original code was: 'call' -> 1, 'put' -> -1. 
    // Wait, original logic: 
    // const mainType = params.type;
    // const dir = mainType === 'call' ? 1 : -1;
    // And calculations often used `1 * dir` or `-1 * dir`.
    // BUT, `mainType` also dictated the leg type (call vs put) for simple strategies.
    // This `dir` variable is a bit confusing in the original code. 
    // Let's look at `single`: `return calcLeg(p, mainType)`. Quantity is +1.
    // `straddle`: Long Straddle = Call K + Put K. `addGreeks(..., 1 * dir)`.
    // If mainType='call' (Long), dir=1. So Long Call + Long Put. Correct.
    // If mainType='put' (Short?), dir=-1. So Short Call + Short Put. Correct.
    // So `mainType` effectively controls "Long/Short" for neutral strategies like Straddle?
    // In the UI: "type" is toggled between 'call'/'put' OR 'Long'/'Short'.
    // label={params.strategy === 'single' ? '期权类型' : '方向 (Direction)'}
    // So if strategy != single, 'call' means LONG, 'put' means SHORT.

    // Standardizing Quantity:
    // If strategy != single:
    //   mainType == 'call' => We are LONG the strategy. Base Quantity = 1.
    //   mainType == 'put'  => We are SHORT the strategy. Base Quantity = -1.

    // If strategy == single:
    //   mainType == 'call' => We are Long Call ? No.
    //   The UI says: "期权类型" -> Call / Put. 
    //   There is NO explicit "Long/Short" toggle for Single in the screenshot?
    //   Wait, checking ControlPanel.tsx...
    //   {params.strategy === 'single' ? '看涨 (Call)' : '做多 (Long)'}
    //   {params.strategy === 'single' ? '看跌 (Put)' : '做空 (Short)'}
    //   So for Single: 'call' = Call, 'put' = Put. Quantity is always +1 ??
    //   Let's check dataGenerator:
    //     if (strategy === 'single') return calcLeg(p, mainType);
    //     Yes, it returns +1 Quantity of type `mainType`.
    //     So Single is ALWAYS LONG? That seems to be the current limitation or design.
    //     (Unless 'Put' implies Short? No, Put is a type).
    //     Okay, assuming Single is always Long for now based on existing code.

    const legs: LegDefinition[] = [];

    // Helper to get scalar values associated with "current" T (not the plotting axis x)
    // Actually, getStrategyLegs needs to return STATIC definitions based on the input params, but T is dynamic during simulation.
    // However, the *offset* (timeDiff) is static.
    // We should return the *parameters* for the legs.

    // We need to support arrays? No, `getStrategyLegs` is usually called with a specific set of params to generate a specific instance (e.g. for the Legend or Tooltip).
    // But `dataGenerator` iterates over X axis.
    // The `createStrategyCalculator` closes over `params`.
    // We should replicate that logic.

    const K = Array.isArray(params.K) ? params.K[0] : params.K;
    const t = Array.isArray(params.t) ? params.t[0] : params.t;
    const tDiscount = params.tDiscount !== undefined ? (Array.isArray(params.tDiscount) ? params.tDiscount[0] : params.tDiscount) : t;
    const sigma = Array.isArray(params.sigma) ? params.sigma[0] : params.sigma;
    const r = Array.isArray(params.r) ? params.r[0] : params.r;

    const width = params.width || 10;
    const width2 = params.width2 || width;
    const timeDiffDays = params.timeDiff || 30;
    const dtTrading = timeDiffDays * (252 / 365);
    const dtCalendar = timeDiffDays / 365;

    // Determination of Base Direction (Long/Short Strategy)
    let baseQty = 1;
    if (s !== 'single') {
        // For strategies, 'put' usually mapped to Short in the UI toggle
        if (mainType === 'put') baseQty = -1;
    }

    if (s === 'custom' && params.customLegs) {
        return params.customLegs;
    }

    if (s === 'single') {
        legs.push({ type: mainType, k: K, t, tDiscount, sigma, r, quantity: 1 });
        return legs;
    }

    if (s === 'straddle') {
        // Long Straddle (call=Long): Long Call K, Long Put K
        // Short Straddle (put=Short): Short Call K, Short Put K
        legs.push({ type: 'call', k: K, t, tDiscount, sigma, r, quantity: 1 * baseQty });
        legs.push({ type: 'put', k: K, t, tDiscount, sigma, r, quantity: 1 * baseQty });
    }
    else if (s === 'strangle') {
        // Long Strangle: Long Put (K-W), Long Call (K+W)
        legs.push({ type: 'put', k: K - width, t, tDiscount, sigma, r, quantity: 1 * baseQty });
        legs.push({ type: 'call', k: K + width, t, tDiscount, sigma, r, quantity: 1 * baseQty });
    }
    else if (s === 'butterfly') {
        // Long Butterfly: Long Call (K-W1), Short 2 Calls K, Long Call (K+W2)
        legs.push({ type: 'call', k: K - width, t, tDiscount, sigma, r, quantity: 1 * baseQty });
        legs.push({ type: 'call', k: K, t, tDiscount, sigma, r, quantity: -2 * baseQty });
        legs.push({ type: 'call', k: K + width2, t, tDiscount, sigma, r, quantity: 1 * baseQty });
    }
    else if (s === 'iron_condor') {
        // Long Iron Condor: Long Put (K-2W), Short Put (K-W), Short Call (K+W), Long Call (K+2W)
        // Wait, standard Iron Condor is usually "Short Iron Condor" (Short Volatility).
        // A "Long" Iron Condor (Long Volatility) is essentially a Strangle? No.
        // Let's stick to the previous implementation:
        // result = addGreeks(result, calcLeg({ ...p, K: K - 2 * width }, 'put'), 1 * dir);
        // result = addGreeks(result, calcLeg({ ...p, K: K - width }, 'put'), -1 * dir);
        // ...
        // So it was: +1 Put (Lower), -1 Put (Low-Mid), -1 Call (High-Mid), +1 Call (Upper)
        // This is a "Long Iron Options Strategy" but profit is limited?
        // Usually Iron Condor is sold for credit (Short Puts + Short Calls).
        // If baseQty=1 (Long specified in UI), we produce exactly the above.
        legs.push({ type: 'put', k: K - 2 * width, t, tDiscount, sigma, r, quantity: 1 * baseQty });
        legs.push({ type: 'put', k: K - width, t, tDiscount, sigma, r, quantity: -1 * baseQty });
        legs.push({ type: 'call', k: K + width, t, tDiscount, sigma, r, quantity: -1 * baseQty });
        legs.push({ type: 'call', k: K + 2 * width, t, tDiscount, sigma, r, quantity: 1 * baseQty });
    }
    else if (s === 'ratio_spread') {
        // Ratio Spread (1:2): Long 1 ATM, Short 2 OTM
        // Call Ratio: Long 1 Call K, Short 2 Call K+W
        const farK = mainType === 'call' ? K + width : K - width;
        // Note: mainType here serves as the OPTION TYPE (Call or Put) for the Ratio Spread
        // But previously we said mainType determines Quanttity? 
        // In Ratio spread, "Direction" usually implies Call Ratio vs Put Ratio.
        // The UI has "Single/Call or Long/Short".
        // Use `mainType` as the option type for the legs.
        // And always assume "Long" Ratio Spread structure (Long 1, Short 2)?
        // Or does "Short" Ratio Spread mean Short 1, Long 2?
        // Existing logic:
        // const dir = mainType === 'call' ? 1 : -1;
        // addGreeks(..., mainType, 1 * dir) -> If call, +1 Call. If put, -1 Put?
        // Wait, if mainType='put', dir=-1.
        // addGreeks(..., 'put', -1). So Short Put.
        // But 'Ratio Spread' usually implies Call Ratio or Put Ratio. we need to know WHICH one.
        // With current controls, we have ONE toggle: Call/Put (or Long/Short).
        // If Strategy=Ratio, does 'type' mean Call Ratio or Put Ratio? Or Long Ratio or Short Ratio?
        // In `dataGenerator`: 
        //    const farK = mainType === 'call' ? K + width : K - width;
        //    calcLeg(..., mainType)
        // This implies mainType IS the leg type (Call or Put).
        // So for Ratio Spread, the toggle acts as "Call Ratio" vs "Put Ratio".
        // What about Long/Short structure?
        // `1 * dir`: If call, +1. If put, -1.
        // This means "Call Ratio" is Long 1 Call, Short 2 Call.
        // "Put Ratio" is Short 1 Put, Long 2 Put?? (Because dir=-1).
        // That seems inverted. Usually Put Ratio is Long 1 Put, Short 2 Put.
        // User might have found this weird.
        // Let's correct this or stick to existing behavior?
        // Existing: `result = addGreeks(result, calcLeg({ ...p, K }, mainType), 1 * dir);`
        // If Put: dir=-1. Quantity = -1 (Short Put).
        // If Call: dir=1. Quantity = +1 (Long Call).
        // This implies "Call Ratio" is Debit (Long front), "Put Ratio" is Credit (Short front).
        // Let's stick to existing logic for consistency during refactor, but it might be worth fixing later.

        legs.push({ type: mainType, k: K, t, tDiscount, sigma, r, quantity: 1 * baseQty });
        legs.push({ type: mainType, k: farK, t, tDiscount, sigma, r, quantity: -2 * baseQty });
    }
    else if (s === 'calendar_spread') {
        // Short Near, Long Far
        // If Call: Short Near Call, Long Far Call.
        // If Put (baseQty=-1?): Long Near Put, Short Far Put?
        // Existing: `result = addGreeks(result, calcLeg(p, mainType), -1 * dir);`
        // Call (dir=1): -1 (Short). Correct.
        // Put (dir=-1): +1 (Long). Correct (Long Near Put, Short Far Put??)
        // Wait. Calendar Spread is usually Long Far, Short Near (Positive Vega).
        // If Put, dir=-1. Near leg becomes +1 (Long). Far leg becomes -1 (Short).
        // This effectively creates a Short Calendar Spread (Short Far, Long Near).
        // So 'Call' = Long Calendar. 'Put' = Short Calendar.
        // This matches "Long/Short" label in UI.

        // Near Leg
        legs.push({ type: mainType, k: K, t, tDiscount, sigma, r, quantity: -1 * baseQty });
        // Far Leg
        const tFar = t + dtTrading;
        const tDiscFar = tDiscount + dtCalendar;
        legs.push({ type: mainType, k: K, t: tFar, tDiscount: tDiscFar, sigma, r, quantity: 1 * baseQty });
    }
    else if (s === 'diagonal_spread') {
        // Short Near OTM, Long Far ATM
        const nearK = mainType === 'call' ? K + width : K - width;
        // Near Leg
        legs.push({ type: mainType, k: nearK, t, tDiscount, sigma, r, quantity: -1 * baseQty });
        // Far Leg
        const tFar = t + dtTrading;
        const tDiscFar = tDiscount + dtCalendar;
        legs.push({ type: mainType, k: K, t: tFar, tDiscount: tDiscFar, sigma, r, quantity: 1 * baseQty });
    }
    else if (s === 'time_butterfly') {
        // Double Calendar
        const K1 = K - width;
        const K2 = K + width;
        const tFar = t + dtTrading;
        const tDiscFar = tDiscount + dtCalendar;

        // Spread 1 at K1
        legs.push({ type: mainType, k: K1, t, tDiscount, sigma, r, quantity: -1 * baseQty });
        legs.push({ type: mainType, k: K1, t: tFar, tDiscount: tDiscFar, sigma, r, quantity: 1 * baseQty });

        // Spread 2 at K2
        legs.push({ type: mainType, k: K2, t, tDiscount, sigma, r, quantity: -1 * baseQty });
        legs.push({ type: mainType, k: K2, t: tFar, tDiscount: tDiscFar, sigma, r, quantity: 1 * baseQty });
    }

    return legs;
}
