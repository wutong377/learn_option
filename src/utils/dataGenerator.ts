import { BlackScholes, SimulationParams, GreeksResult } from './blackScholes';
import { OptionParams } from '../types';
import { getStrategyLegs } from './strategyDefinitions';

export type AxisVariable = 'S' | 't' | 'sigma' | 'r';

export interface SeriesData {
    name: string;
    data: number[];
}

export interface ChartDataSeries {
    xAxis: number[];
    series: { [key in keyof GreeksResult]: SeriesData[] };
}

// Helper Types
type StrategyCalc = (p: SimulationParams) => GreeksResult;

// --- Shared Strategy Logic ---

const emptyGreeks = (): GreeksResult => ({
    price: 0, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0,
    vanna: 0, charm: 0, speed: 0, color: 0, volga: 0, zomma: 0, pnl: 0
});

const calcLeg = (p: SimulationParams, type: 'call' | 'put') => BlackScholes.calculate(p, type);

const addGreeks = (a: GreeksResult, b: GreeksResult, weight: number = 1) => {
    const res = { ...a };
    (Object.keys(a) as Array<keyof GreeksResult>).forEach(k => {
        res[k] += b[k] * weight;
    });
    return res;
};

// Extracted Strategy Calculator
function createStrategyCalculator(params: OptionParams): StrategyCalc {
    return (p: SimulationParams): GreeksResult => {
        const currentParams: OptionParams = {
            ...params,
            ...p, // Override S, K, t, sigma, r with dynamic values
        };

        const legs = getStrategyLegs(currentParams);

        let result = emptyGreeks();

        legs.forEach(leg => {
            const legParams: SimulationParams = {
                S: p.S,
                K: leg.k,
                t: leg.t,
                tDiscount: leg.tDiscount,
                sigma: leg.sigma,
                r: leg.r,
                q: Array.isArray(params.q) ? params.q[0] : params.q,
                isTextbookMode: params.isTextbookMode
            };

            const legGreeks = calcLeg(legParams, leg.type);
            result = addGreeks(result, legGreeks, leg.quantity);
        });

        return result;
    };
}


export function generateDataSeries(
    params: OptionParams,
    axisVar: AxisVariable,
    steps: number = 50,
    isExpiry: boolean = false
): ChartDataSeries {
    const xAxis: number[] = [];

    const getScalar = (val: number | number[] | undefined) => {
        if (val === undefined) return undefined;
        return Array.isArray(val) ? val[0] : val;
    };

    const baseT = getScalar(params.t) as number;
    const baseTDiscount = getScalar(params.tDiscount) as number | undefined;

    const baseParams: any = {
        S: getScalar(params.S) as number,
        K: getScalar(params.K) as number,
        t: baseT,
        tDiscount: baseTDiscount,
        sigma: getScalar(params.sigma) as number,
        r: getScalar(params.r) as number,
        type: params.type
    };

    let minVal = 0;
    let maxVal = 0;

    // Define ranges
    if (axisVar === 'S') {
        minVal = baseParams.K * 0.5;
        maxVal = baseParams.K * 1.5;
        if (minVal === maxVal) { minVal = 50; maxVal = 150; }
    } else if (axisVar === 't') {
        // 使用自然天数范围 [0, 365]，对应年化 [0, 1]
        minVal = 0.0001; // 接近 0，避免除零问题
        maxVal = 1.0; // 365 自然天 = 1 年
    } else if (axisVar === 'sigma') {
        minVal = 0.05;
        maxVal = 1.0;
    } else if (axisVar === 'r') {
        minVal = 0.0;
        maxVal = Math.max(baseParams.r * 2, 0.10);
    }

    const stepSize = (maxVal - minVal) / (steps - 1);
    for (let i = 0; i < steps; i++) {
        xAxis.push(minVal + stepSize * i);
    }

    let compareVar: keyof OptionParams | null = null;
    const arrayCandidates: (keyof OptionParams)[] = ['S', 'K', 't', 'sigma', 'r', 'q'];

    for (const key of arrayCandidates) {
        if (key !== axisVar && Array.isArray(params[key]) && (params[key] as number[]).length > 1) {
            compareVar = key;
            break;
        }
    }

    const seriesResult: { [key in keyof GreeksResult]: SeriesData[] } = {
        price: [], delta: [], gamma: [], theta: [], vega: [], rho: [],
        vanna: [], charm: [], speed: [], color: [], volga: [], zomma: [], pnl: []
    };

    const greekKeys = Object.keys(seriesResult) as Array<keyof GreeksResult>;
    const timeRatio = (baseTDiscount !== undefined && baseT > 0) ? baseTDiscount / baseT : 1.0;

    // Create Calculator
    const calculateStrategy = createStrategyCalculator(params);

    const runSimulation = (simParams: any, name: string) => {
        // Initialize with default emptyGreeks (including pnl:0)
        const currentSeries: { [key in keyof GreeksResult]: number[] } = {
            price: [], delta: [], gamma: [], theta: [], vega: [], rho: [],
            vanna: [], charm: [], speed: [], color: [], volga: [], zomma: [], pnl: []
        };

        // Calculate Initial Cost based on CURRENT params (before simulation loop overrides) for P&L
        // Note: For 'Expiry P&L', we compare (Price at t=0) - (Price at t=current)
        // We need the scalar params for the initial calculation.
        const initialP = {
            S: baseParams.S, K: baseParams.K, t: baseT,
            sigma: baseParams.sigma, r: baseParams.r,
            tDiscount: baseTDiscount
        } as SimulationParams;
        const initialGreeks = calculateStrategy(initialP);
        const initialCost = initialGreeks.price;


        for (let i = 0; i < steps; i++) {
            const xVal = xAxis[i];
            const p = { ...simParams };
            p[axisVar] = xVal;

            if (axisVar === 't' && p.tDiscount !== undefined) {
                p.tDiscount = xVal * timeRatio;
            }

            // Expiry Logic: If strictly expiry view, force t approx 0.
            if (isExpiry) {
                p.t = 0.0001;
                if (p.tDiscount !== undefined) p.tDiscount = 0.0001;
            }

            const greeks = calculateStrategy(p as SimulationParams);
            greeks.pnl = greeks.price - initialCost;

            greekKeys.forEach(k => currentSeries[k].push(greeks[k]));
        }

        greekKeys.forEach(k => {
            seriesResult[k].push({ name, data: currentSeries[k] });
        });
    };

    if (compareVar) {
        const values = params[compareVar] as number[];
        values.forEach((v, idx) => {
            const p = { ...baseParams, [compareVar!]: v };

            if (compareVar === 't' && Array.isArray(params.tDiscount) && params.tDiscount.length > idx) {
                p.tDiscount = params.tDiscount[idx];
            }

            let label = `${compareVar}=${v}`;
            if (compareVar === 't') {
                let naturalDaysVal: number | undefined;
                if (Array.isArray(params.tDiscount) && params.tDiscount.length > idx) {
                    naturalDaysVal = params.tDiscount[idx];
                } else if (!Array.isArray(params.t) && v === params.t) {
                    naturalDaysVal = params.tDiscount;
                }

                if (naturalDaysVal !== undefined) {
                    label = `t=${(naturalDaysVal * 365).toFixed(0)}d`;
                } else {
                    label = `t=${(v * 252).toFixed(0)}d (Trading)`;
                }
            } else if (compareVar === 'sigma') {
                label = `σ=${(v * 100).toFixed(0)}%`;
            } else if (compareVar === 'r') {
                label = `r=${(v * 100).toFixed(1)}%`;
            } else if (compareVar === 'q') {
                label = `q=${(v * 100).toFixed(1)}%`;
            }

            runSimulation(p, label);
        });
    } else {
        runSimulation(baseParams, 'Default');
    }

    return { xAxis, series: seriesResult };
}

export interface SurfaceData {
    data: [number, number, number][]; // [x (Spot), y (Time), z (Value)]
    minS: number;
    maxS: number;
    minT: number;
    maxT: number;
    breakEvenLine?: [number, number, number][]; // For 3D P&L
}

export function generateSurfaceData(
    params: OptionParams,
    zKey: keyof GreeksResult = 'delta',
    steps = 40
): SurfaceData {
    const data: [number, number, number][] = [];

    const getScalar = (val: number | number[]) => Array.isArray(val) ? val[0] : val;
    const scalarK = getScalar(params.K);
    const scalarT = getScalar(params.t);
    const scalarSigma = getScalar(params.sigma);
    const scalarR = getScalar(params.r);

    const minS = scalarK * 0.5;
    const maxS = scalarK * 1.5;
    const minT = 0.1;
    const maxT = Math.max(scalarT * 1.5, 1.0);

    const stepS = (maxS - minS) / (steps - 1);
    const stepT = (maxT - minT) / (steps - 1);

    // Create Calculator using shared strategy logic
    // Create Calculator using shared strategy logic
    const calculateStrategy = createStrategyCalculator(params);

    // Initial Cost for P&L
    const initialT = getScalar(params.t);
    const initialP = {
        S: getScalar(params.S), K: scalarK, t: initialT,
        sigma: scalarSigma, r: scalarR
    } as SimulationParams;
    const initialGreeks = calculateStrategy(initialP);
    const initialCost = initialGreeks.price;


    const breakEvenLine: [number, number, number][] = [];

    for (let j = 0; j < steps; j++) {
        const tVal = minT + stepT * j;
        let previousPnl = 0;
        let previousS = 0;

        for (let i = 0; i < steps; i++) {
            const sVal = minS + stepS * i;

            const scenarioParams: SimulationParams = {
                S: sVal,
                K: scalarK,
                t: tVal,
                sigma: scalarSigma,
                r: scalarR,
            };

            const res = calculateStrategy(scenarioParams);

            if (zKey === 'pnl') {
                // For 3D P&L
                res.pnl = res.price - initialCost;
                data.push([sVal, tVal, res.pnl]);

                // Detect Zero Crossing for Break Even Line
                const currentPnl = res.pnl;
                if (i > 0 && Math.sign(currentPnl) !== Math.sign(previousPnl)) {
                    // Interpolate
                    // Let P(s) = y. We want s where P(s) = 0.
                    // Linear interp: s = s0 + (0 - y0) * (s1 - s0) / (y1 - y0)
                    if (previousPnl !== currentPnl) {
                        const zeroS = previousS + (0 - previousPnl) * (sVal - previousS) / (currentPnl - previousPnl);
                        breakEvenLine.push([zeroS, tVal, 0]);
                    }
                }
                previousPnl = currentPnl;
                previousS = sVal;
            } else {
                const val = res[zKey];
                data.push([sVal, tVal, val !== undefined ? val : 0]);
            }
        }
    }

    return { data, minS, maxS, minT, maxT, breakEvenLine: zKey === 'pnl' ? breakEvenLine : undefined };
}
