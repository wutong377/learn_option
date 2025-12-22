import React, { useMemo, useState } from 'react';
import { OptionParams } from '../../types';
import { generateDataSeries, generateSurfaceData, AxisVariable } from '../../utils/dataGenerator';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { Chart } from '../charts/Chart';
import { SurfaceChart } from '../charts/SurfaceChart';
import { InfoTooltip } from '../ui/InfoTooltip';
import { GreekDefinitionModal } from '../ui/GreekDefinitionModal';
import { Box, MapPin } from 'lucide-react';
import { GreeksResult, BlackScholes } from '../../utils/blackScholes';
import { GREEK_DEFINITIONS } from '../../utils/definitions';
import * as echarts from 'echarts';

interface GreeksDashboardProps {
    params: OptionParams;
}

const GRAPH_CONFIGS = {
    basic: [
        { key: 'price', title: '期权价格', color: '#60a5fa' },
        { key: 'delta', title: 'Delta (Δ)', color: '#34d399' },
        { key: 'gamma', title: 'Gamma (Γ)', color: '#f472b6' },
        { key: 'theta', title: 'Theta (Θ)', color: '#fbbf24' },
        { key: 'vega', title: 'Vega (ν)', color: '#a78bfa' },
        { key: 'rho', title: 'Rho (ρ)', color: '#f87171' },
    ] as const,
    advanced: [
        { key: 'vanna', title: 'Vanna', color: '#2dd4bf' },
        { key: 'charm', title: 'Charm', color: '#fb923c' },
        { key: 'speed', title: 'Speed', color: '#c084fc' },
        { key: 'color', title: 'Color', color: '#facc15' },
        { key: 'volga', title: 'Volga (Vomma)', color: '#e879f9' },
        { key: 'zomma', title: 'Zomma', color: '#4ade80' },
    ] as const,
};

const ALL_GREEKS = [...GRAPH_CONFIGS.basic, ...GRAPH_CONFIGS.advanced];

export const GreeksDashboard: React.FC<GreeksDashboardProps> = ({ params }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'surface'>('basic');
    const [xAxisVar, setXAxisVar] = useState<AxisVariable>('S');
    const [zAxisVar, setZAxisVar] = useState<keyof GreeksResult>('delta');
    const [selectedGreek, setSelectedGreek] = useState<string | null>(null);
    const [markerInput, setMarkerInput] = useState<string>('');

    // 2D Data
    const { xAxis, series } = useMemo(() => {
        return generateDataSeries(params, xAxisVar, 1000);
    }, [params, xAxisVar]);

    // 3D Data
    const surfaceData = useMemo(() => {
        if (activeTab !== 'surface') return null;
        return generateSurfaceData(params, zAxisVar, 40);
    }, [params, zAxisVar, activeTab]);

    // Calculate Marker Greeks
    const markerResults = useMemo(() => {
        if (!markerInput || isNaN(parseFloat(markerInput))) return null;

        const val = parseFloat(markerInput);
        let internalVal = val;

        // Convert input units to internal units
        if (xAxisVar === 't') internalVal = val / 252;
        if (xAxisVar === 'sigma') internalVal = val / 100;

        // Identify multi-series variable
        let compareVar: keyof OptionParams | null = null;
        const arrayCandidates: (keyof OptionParams)[] = ['S', 'K', 't', 'sigma', 'r'];
        for (const key of arrayCandidates) {
            if (key !== (xAxisVar as string) && Array.isArray(params[key]) && (params[key] as number[]).length > 1) {
                compareVar = key;
                break;
            }
        }

        const results: { name: string, greeks: GreeksResult }[] = [];
        const baseParams: any = { ...params, [xAxisVar]: internalVal };

        // Handle dual-time for marker if X-axis is 't'
        if (xAxisVar === 't') {
            // Get scalar base t and tDiscount from params to calculate ratio
            const getScalar = (v: number | number[] | undefined) => Array.isArray(v) ? v[0] : v;
            const baseT = getScalar(params.t) as number;
            const baseTDiscount = getScalar(params.tDiscount) as number | undefined;

            if (baseTDiscount !== undefined && baseT > 0) {
                const ratio = baseTDiscount / baseT;
                baseParams.tDiscount = internalVal * ratio;
            }
        }

        if (compareVar) {
            const values = params[compareVar] as number[];
            values.forEach(v => {
                const p: any = { ...baseParams, [compareVar!]: v };
                // Flatten other array params (scalar logic handled in BlackScholes wrapper usually, but let's be safe)
                // Actually BlackScholes.calculate expects scalar SimulationParams.
                // We need to ensure p has only scalars. 
                // Any other array param should perform a "take first" fallback or loop?
                // dataGenerator assumes only ONE compare var. Others are [0].
                arrayCandidates.forEach(k => {
                    if (k !== xAxisVar && k !== compareVar && Array.isArray(p[k])) {
                        p[k] = (p[k] as number[])[0];
                    }
                });

                const label = `${compareVar}=${v}`;
                // Format label for display (days, %)
                let displayLabel = label;
                if (compareVar === 't') displayLabel = `t=${(v * 252).toFixed(0)}d (Trading)`;
                if (compareVar === 'sigma') displayLabel = `σ=${(v * 100).toFixed(0)}%`;
                if (compareVar === 'r') displayLabel = `r=${(v * 100).toFixed(1)}%`;

                results.push({ name: displayLabel, greeks: BlackScholes.calculate(p, params.type) });
            });
        } else {
            // Ensure scalars
            const p: any = { ...baseParams };
            arrayCandidates.forEach(k => {
                if (k !== xAxisVar && Array.isArray(p[k])) {
                    p[k] = (p[k] as number[])[0];
                }
            });
            results.push({ name: 'Current', greeks: BlackScholes.calculate(p, params.type) });
        }

        return results;

    }, [markerInput, params, xAxisVar]);


    // Helper to create chart option for 2D
    const getOption = (title: string, dataKey: keyof GreeksResult, color: string): echarts.EChartsOption => {
        const currentSeriesList = series[dataKey];
        const isMultiSeries = currentSeriesList.length > 1;

        let markLineData: any[] = [];
        const markerVal = parseFloat(markerInput);

        if (!isNaN(markerVal)) {
            markLineData = [
                {
                    xAxis: markerVal, // ECharts matches X axis value directly
                    label: { show: true, formatter: '{c}' },
                    lineStyle: { type: 'solid', color: '#fff', width: 2 }
                }
            ];
        }

        return {
            backgroundColor: 'transparent',
            title: {
                text: title,
                left: 'center',
                textStyle: { color: '#e5e7eb', fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                borderColor: '#374151',
                textStyle: { color: '#f3f4f6' },
                formatter: (params: any) => {
                    if (!Array.isArray(params)) return '';
                    let result = `${params[0].axisValueLabel}<br/>`;
                    params.forEach((p: any) => {
                        let sName = p.seriesName;
                        if (sName.startsWith('t=')) {
                            const val = parseFloat(sName.split('=')[1]);
                            if (!isNaN(val)) sName = `t=${(val * 252).toFixed(0)}d (Trading)`;
                        }
                        result += `${p.marker} ${sName}: ${p.value.toFixed(4)}<br/>`;
                    });
                    return result;
                }
            },
            legend: {
                show: isMultiSeries,
                top: 25,
                textStyle: { color: '#9ca3af', fontSize: 10 },
                itemWidth: 15,
                itemHeight: 10
            },
            grid: { top: isMultiSeries ? 50 : 40, right: 20, bottom: 30, left: 50, containLabel: false },
            xAxis: {
                type: 'category',
                data: xAxis.map(v => {
                    if (xAxisVar === 't') return (v * 252).toFixed(0);
                    if (xAxisVar === 'sigma') return (v * 100).toFixed(0);
                    return v.toFixed(2);
                }),
                axisLine: { lineStyle: { color: '#4b5563' } },
                axisLabel: { color: '#9ca3af', showMaxLabel: true, showMinLabel: true }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
                axisLabel: { color: '#9ca3af' },
                scale: true
            },
            series: currentSeriesList.map((s, index) => ({
                name: s.name,
                data: s.data,
                type: 'line',
                smooth: true,
                showSymbol: false,
                color: isMultiSeries ? undefined : color,
                lineStyle: { width: isMultiSeries ? 2 : 3 },
                markLine: index === 0 ? {
                    symbol: 'none',
                    data: markLineData,
                    animation: false
                } : undefined
            }))
        };
    };

    const getAxisLabel = (v: AxisVariable) => {
        if (v === 'S') return '价格 (S)';
        if (v === 't') return '时间 (Trading Days)';
        if (v === 'sigma') return '波动率 (%)';
        if (v === 'r') return '利率 (%)';
        return v;
    }

    return (
        <div className="flex flex-col h-full bg-gray-900/30">
            {/* Top Bar: Tabs & Axis Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800 mb-4 gap-4 sticky top-0 z-20 backdrop-blur-md shadow-sm">

                {/* View Tabs */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('basic')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'basic' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        基础维度
                    </button>
                    <button
                        onClick={() => setActiveTab('advanced')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'advanced' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        高阶希腊字母
                    </button>
                    <button
                        onClick={() => setActiveTab('surface')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${activeTab === 'surface' ? 'bg-teal-600 text-white shadow' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Box className="w-4 h-4" />
                        3D 曲面图
                    </button>
                </div>

                {/* Controls based on view */}
                {activeTab !== 'surface' ? (
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex bg-gray-800 rounded-lg p-1">
                                <button onClick={() => setXAxisVar('S')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 'S' ? 'bg-teal-600 text-white' : 'text-gray-400'}`}>S</button>
                                <button onClick={() => setXAxisVar('t')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 't' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>t (Trading)</button>
                                <button onClick={() => setXAxisVar('sigma')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 'sigma' ? 'bg-pink-600 text-white' : 'text-gray-400'}`}>σ</button>
                            </div>
                        </div>

                        {/* Marker Input */}
                        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                            <MapPin className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-gray-400 whitespace-nowrap">精准定位 {getAxisLabel(xAxisVar)}:</span>
                            <input
                                type="number"
                                value={markerInput}
                                onChange={(e) => setMarkerInput(e.target.value)}
                                className="w-16 bg-transparent text-white text-sm font-bold outline-none border-b border-gray-600 focus:border-yellow-500 text-center"
                                placeholder="Value"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400">纵轴指标:</span>
                        <select
                            className="bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-700 outline-none focus:border-teal-500"
                            value={zAxisVar}
                            onChange={(e) => setZAxisVar(e.target.value as keyof GreeksResult)}
                        >
                            {ALL_GREEKS.map(g => (
                                <option key={g.key} value={g.key}>{g.title}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
                {activeTab === 'surface' && surfaceData ? (
                    <div className="h-full bg-gray-800/80 rounded-xl border border-gray-700/50 p-4 shadow-lg relative flex flex-col">
                        <SurfaceChart
                            data={surfaceData.data}
                            zLabel={ALL_GREEKS.find(g => g.key === zAxisVar)?.title || zAxisVar}
                            minS={surfaceData.minS}
                            maxS={surfaceData.maxS}
                            minT={surfaceData.minT}
                            maxT={surfaceData.maxT}
                            height="100%"
                        />
                        {/* ... existing surface controls ... */}
                        <div className="absolute top-4 right-4 z-10">
                            <div onClick={() => setSelectedGreek(zAxisVar as string)} className="cursor-pointer">
                                <InfoTooltip greekKey={zAxisVar} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {GRAPH_CONFIGS[activeTab as 'basic' | 'advanced'].map((config) => (
                            <div
                                key={config.key}
                                onClick={() => setSelectedGreek(config.key as string)}
                                className="bg-gray-800/80 rounded-xl border border-gray-700/50 p-4 shadow-lg hover:border-blue-500/50 hover:bg-gray-800 transition-all cursor-pointer relative group"
                            >
                                {/* Info Icon */}
                                <div className="absolute top-0 right-0 w-16 h-16 z-20 flex items-start justify-end p-4 group/icon">
                                    <div
                                        className="opacity-0 group-hover/icon:opacity-100 transition-opacity bg-gray-800 rounded-full"
                                        onClick={(e) => { e.stopPropagation(); }}
                                    >
                                        <InfoTooltip greekKey={config.key} />
                                    </div>
                                </div>

                                {/* Marker Result Overlay */}
                                {markerResults && (
                                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                        <div className="bg-gray-900/90 border-l-2 border-yellow-500 p-2 rounded shadow-xl backdrop-blur-sm">
                                            {markerResults.length === 1 ? (
                                                <div className="text-xl font-bold text-white tracking-wide">
                                                    {markerResults[0].greeks[config.key as keyof GreeksResult].toFixed(4)}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {markerResults.map((res, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                                            <span className="text-gray-400">{res.name}:</span>
                                                            <span className="font-mono font-bold text-white">
                                                                {res.greeks[config.key as keyof GreeksResult].toFixed(4)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Chart
                                    options={getOption(config.title, config.key as keyof GreeksResult, config.color)}
                                    height={260}
                                />
                                <div className="mt-2 text-center border-t border-gray-700/50 pt-2">
                                    <div className="text-gray-300 text-sm py-1">
                                        <Latex>{`$${(params.type === 'put' && GREEK_DEFINITIONS[config.key]?.latexPut)
                                                ? GREEK_DEFINITIONS[config.key].latexPut
                                                : GREEK_DEFINITIONS[config.key]?.latex
                                            }$`}</Latex>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <GreekDefinitionModal
                greekKey={selectedGreek}
                onClose={() => setSelectedGreek(null)}
            />
        </div>
    );
};
