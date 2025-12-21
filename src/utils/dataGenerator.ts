import { BlackScholes, SimulationParams, GreeksResult } from './blackScholes';
import { OptionParams } from '../types';

export type AxisVariable = 'S' | 't' | 'sigma';

export interface SeriesData {
    name: string;
    data: number[];
}

export interface ChartDataSeries {
    xAxis: number[];
    series: { [key in keyof GreeksResult]: SeriesData[] };
}

export function generateDataSeries(
    params: OptionParams,
    axisVar: AxisVariable,
    steps: number = 50
): ChartDataSeries {
    const xAxis: number[] = [];

    // 1. Identify valid scalar base params and the comparison variable
    // We need a base set of scalar params for range calculation.
    // If a param is an array, take the first value as "base" or calculate range differently?
    // Let's take the first value of any array param as the base for range calculation.
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

    // Define ranges based on variable
    if (axisVar === 'S') {
        minVal = baseParams.K * 0.5;
        maxVal = baseParams.K * 1.5;
        if (minVal === maxVal) { minVal = 50; maxVal = 150; }
    } else if (axisVar === 't') {
        minVal = 0.01;
        maxVal = Math.max(baseParams.t * 2, 1.0);
    } else if (axisVar === 'sigma') {
        minVal = 0.05;
        maxVal = 1.0;
    }

    const stepSize = (maxVal - minVal) / (steps - 1);
    for (let i = 0; i < steps; i++) {
        xAxis.push(minVal + stepSize * i);
    }

    // 2. Determine if we are in "Comparison Mode"
    // Find which parameter has multiple values (is an array with length > 1)
    // We prioritize the first array found order: S, K, t, sigma, r.
    // NOTE: The axisVar cannot be the comparison var (it varies along X).

    let compareVar: keyof OptionParams | null = null;
    const arrayCandidates: (keyof OptionParams)[] = ['S', 'K', 't', 'sigma', 'r'];

    for (const key of arrayCandidates) {
        if (key !== axisVar && Array.isArray(params[key]) && (params[key] as number[]).length > 1) {
            compareVar = key;
            break;
        }
    }

    const seriesResult: { [key in keyof GreeksResult]: SeriesData[] } = {
        price: [], delta: [], gamma: [], theta: [], vega: [], rho: [],
        vanna: [], charm: [], speed: [], color: [], volga: [], zomma: []
    };

    const greekKeys = Object.keys(seriesResult) as Array<keyof GreeksResult>;

    // Calculate time ratio if both exist, to maintain dual-time scaling when t varies
    const timeRatio = (baseTDiscount !== undefined && baseT > 0) ? baseTDiscount / baseT : 1.0;

    // Helper to run simulation for a specific set of scalar params over the X axis
    const runSimulation = (simParams: any, name: string) => {
        const currentSeries: { [key in keyof GreeksResult]: number[] } = {
            price: [], delta: [], gamma: [], theta: [], vega: [], rho: [],
            vanna: [], charm: [], speed: [], color: [], volga: [], zomma: []
        };

        for (let i = 0; i < steps; i++) {
            const xVal = xAxis[i];
            const p = { ...simParams };
            // Override the axis variable
            p[axisVar] = xVal;

            // If varying 't', also scale 'tDiscount' if it was present
            if (axisVar === 't' && p.tDiscount !== undefined) {
                p.tDiscount = xVal * timeRatio;
            }

            const greeks = BlackScholes.calculate(p as SimulationParams, params.type);
            greekKeys.forEach(k => currentSeries[k].push(greeks[k]));
        }

        greekKeys.forEach(k => {
            seriesResult[k].push({ name, data: currentSeries[k] });
        });
    };

    const paramJsx: Record<string, string> = {
        'S': 'S',
        'K': 'K',
        't': 't',
        'sigma': 'σ',
        'r': 'r'
    };

    if (compareVar) {
        // Multi-series mode
        const values = params[compareVar] as number[];
        // If comparing t, we might need tDiscount array too if it exists
        // But simpler to just rely on baseParams ratio if strict array matching isn't guaranteed
        values.forEach((v, idx) => {
            const p = { ...baseParams, [compareVar!]: v };

            // Special handling if we are engaging in multi-value t, we need corresponding tDiscount if available
            if (compareVar === 't' && Array.isArray(params.tDiscount) && params.tDiscount.length > idx) {
                p.tDiscount = params.tDiscount[idx];
            }

            const sym = paramJsx[compareVar as string] || compareVar;
            const label = `${sym}=${v}`;
            runSimulation(p, label);
        });
    } else {
        // Single series mode
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
}

export function generateSurfaceData(
    params: OptionParams,
    zKey: keyof GreeksResult = 'delta',
    steps = 40
): SurfaceData {
    const data: [number, number, number][] = [];

    // Ranges
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

    for (let j = 0; j < steps; j++) {
        const tVal = minT + stepT * j;
        for (let i = 0; i < steps; i++) {
            const sVal = minS + stepS * i;

            const scenarioParams: SimulationParams = {
                S: sVal,
                K: scalarK,
                t: tVal,
                sigma: scalarSigma,
                r: scalarR,
            };

            const res = BlackScholes.calculate(scenarioParams, params.type);
            data.push([sVal, tVal, res[zKey]]);
        }
    }

    return { data, minS, maxS, minT, maxT };
}
