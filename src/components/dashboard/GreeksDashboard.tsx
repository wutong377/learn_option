import React, { useMemo, useState } from 'react';
import { OptionParams } from '../../types';
import { generateDataSeries, generateSurfaceData, AxisVariable } from '../../utils/dataGenerator';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { Chart } from '../charts/Chart';
import { StrategyLegs } from './StrategyLegs';
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
    const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'surface' | 'pnl_expiry' | 'pnl_surface'>('basic');
    const [xAxisVar, setXAxisVar] = useState<AxisVariable>('S');
    const [zAxisVar, setZAxisVar] = useState<keyof GreeksResult>('delta');
    const [selectedGreek, setSelectedGreek] = useState<string | null>(null);
    const [markerInput, setMarkerInput] = useState<string>('');

    // 2D Data (Standard Greeks)
    const { xAxis, series } = useMemo(() => {
        // If viewing P&L Expiry, we handle it separately
        if (activeTab === 'pnl_expiry') return { xAxis: [], series: {} as any };
        return generateDataSeries(params, xAxisVar, 1000);
    }, [params, xAxisVar, activeTab]);

    // Expiry P&L Data
    const expiryPnlData = useMemo(() => {
        if (activeTab !== 'pnl_expiry') return null;
        // Always usage 'S' as axis for P&L typical view
        return generateDataSeries(params, 'S', 500, true);
    }, [params, activeTab]);

    // 3D Data (Standard or P&L)
    const surfaceData = useMemo(() => {
        if (activeTab === 'pnl_surface') {
            return generateSurfaceData(params, 'pnl');
        }
        if (activeTab !== 'surface') return null;
        return generateSurfaceData(params, zAxisVar);
    }, [params, activeTab, zAxisVar]);

    // Calculate Marker Greeks (Only for standard views)
    const markerResults = useMemo(() => {
        const results: Array<{ name: string, greeks: GreeksResult }> = [];
        if (!markerInput || isNaN(parseFloat(markerInput))) return results;

        // Convert Display Unit to Raw Unit for Interpolation
        let markerVal = parseFloat(markerInput);
        if (xAxisVar === 't') {
            markerVal = markerVal / 365; // 自然天数转换为年
        } else if (xAxisVar === 'sigma' || xAxisVar === 'r') {
            markerVal = markerVal / 100;
        }

        if (!xAxis || xAxis.length === 0) return results;

        // Helper to interpolate Y for a given X
        const interpolate = (targetX: number, xArr: number[], yArr: number[]): number => {
            if (xArr.length !== yArr.length) return NaN;

            if (targetX <= xArr[0]) return yArr[0];
            if (targetX >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];

            let i = 0;
            while (i < xArr.length - 1 && xArr[i + 1] < targetX) {
                i++;
            }

            const x0 = xArr[i];
            const x1 = xArr[i + 1];
            const y0 = yArr[i];
            const y1 = yArr[i + 1];

            if (x1 === x0) return y0;

            const t = (targetX - x0) / (x1 - x0);
            return y0 + t * (y1 - y0);
        };

        // Only process if series has content (might be empty if in pnl mode)
        const greekKeys = Object.keys(series || {}) as Array<keyof GreeksResult>;
        if (greekKeys.length === 0) return results;

        // Ensure we inspect the first greek to get series names
        const firstGreek = greekKeys[0];
        const sDataList = series[firstGreek];

        if (!sDataList) return results;

        sDataList.forEach((sMeta: any, sIdx: number) => {
            const resultGreeks: Partial<GreeksResult> = {};

            greekKeys.forEach(gKey => {
                const sArr = series[gKey][sIdx];
                if (sArr && sArr.data) {
                    resultGreeks[gKey] = interpolate(markerVal, xAxis, sArr.data);
                }
            });

            results.push({ name: sMeta.name, greeks: resultGreeks as GreeksResult });
        });

        return results;

    }, [markerInput, xAxis, series, xAxisVar]);

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
                    let xVal = params[0].value[0];
                    if (typeof xVal === 'number') xVal = xVal.toFixed(2);

                    let result = `${xVal}<br/>`;
                    params.forEach((p: any) => {
                        let sName = p.seriesName;
                        let val = p.value[1]; // Value axis data is [x, y]
                        result += `${p.marker} ${sName}: ${val.toFixed(4)}<br/>`;
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
                type: 'value',
                min: 'dataMin',
                max: 'dataMax',
                inverse: xAxisVar === 't',
                axisLine: { lineStyle: { color: '#4b5563' } },
                axisLabel: { color: '#9ca3af', showMaxLabel: true, showMinLabel: true, formatter: (v: number) => v.toFixed(2) },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
                axisLabel: { color: '#9ca3af' },
                scale: true
            },
            series: currentSeriesList.map((s: any, index: number) => {
                // Scale X-axis for display and markers
                const scaledX = xAxis.map(v => {
                    if (xAxisVar === 't') return v * 365; // 年转换为自然天数显示
                    if (xAxisVar === 'sigma') return v * 100;
                    if (xAxisVar === 'r') return v * 100;
                    return v;
                });

                return {
                    name: s.name,
                    data: scaledX.map((x, i) => [x, s.data[i]]),
                    type: 'line',
                    smooth: true,
                    showSymbol: false,
                    color: isMultiSeries ? undefined : color,
                    lineStyle: { width: isMultiSeries ? 2 : 3 },
                    // Apply markLine to all series to ensure visibility and prevent layering issues
                    markLine: {
                        symbol: 'none',
                        data: markLineData,
                        animation: false,
                        lineStyle: { type: 'solid', color: '#fff', width: 2 },
                        label: { show: true, formatter: '{c}' }
                    }
                };
            })
        };
    };

    const getAxisLabel = (v: AxisVariable) => {
        if (v === 'S') return '价格 (S)';
        if (v === 't') return '剩余自然天数';
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
                    <button
                        onClick={() => setActiveTab('pnl_expiry')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pnl_expiry' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        到期盈亏 (2D)
                    </button>
                    <button
                        onClick={() => setActiveTab('pnl_surface')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pnl_surface' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        盈亏曲面 (3D)
                    </button>
                </div>

                {/* Controls based on view */}
                {(activeTab !== 'surface' && activeTab !== 'pnl_surface') ? (
                    <div className="flex flex-wrap items-center gap-4">
                        {activeTab !== 'pnl_expiry' && (
                            <div className="flex items-center gap-2">
                                <div className="flex bg-gray-800 rounded-lg p-1">
                                    <button onClick={() => setXAxisVar('S')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 'S' ? 'bg-teal-600 text-white' : 'text-gray-400'}`}>S</button>
                                    <button onClick={() => setXAxisVar('t')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 't' ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>t (Calendar)</button>
                                    <button onClick={() => setXAxisVar('sigma')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 'sigma' ? 'bg-pink-600 text-white' : 'text-gray-400'}`}>σ</button>
                                    <button onClick={() => setXAxisVar('r')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${xAxisVar === 'r' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>r</button>
                                </div>
                            </div>
                        )}

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
                    activeTab === 'surface' && (
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
                    )
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2">
                {(activeTab === 'surface' || activeTab === 'pnl_surface') && surfaceData ? (
                    <div className="h-full bg-gray-800/80 rounded-xl border border-gray-700/50 p-4 shadow-lg relative flex flex-col">
                        <SurfaceChart
                            data={surfaceData.data}
                            zLabel={ALL_GREEKS.find(g => g.key === zAxisVar)?.title || zAxisVar}
                            minS={surfaceData.minS}
                            maxS={surfaceData.maxS}
                            minT={surfaceData.minT}
                            maxT={surfaceData.maxT}
                            breakEvenLine={surfaceData.breakEvenLine}
                            height="100%"
                        />
                        {/* ... existing surface controls ... */}
                        <div className="absolute top-4 right-4 z-10">
                            <div onClick={() => setSelectedGreek(zAxisVar as string)} className="cursor-pointer">
                                <InfoTooltip greekKey={zAxisVar} />
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'pnl_expiry' && expiryPnlData ? (
                    <div className="h-full bg-gray-800/80 rounded-xl border border-gray-700/50 p-4 shadow-lg">
                        {(() => {
                            const pnlS = expiryPnlData.series && expiryPnlData.series.pnl ? expiryPnlData.series.pnl[0] : undefined;
                            if (!pnlS) return <div className="text-gray-400 text-center mt-10">No Data</div>;
                            const sData = pnlS.data;
                            const xData = expiryPnlData.xAxis;

                            // Analysis: Find Break-even and Inflection Points
                            const breakEvens: number[] = [];

                            // 1. Find Break-Evens (Zero Crossings)
                            for (let i = 1; i < sData.length; i++) {
                                const val = sData[i];
                                const prev = sData[i - 1];
                                if (Math.sign(prev) !== Math.sign(val) && prev !== val) {
                                    // Linear interp for S
                                    const sPrev = xData[i - 1];
                                    const sCurr = xData[i];
                                    const zeroS = sPrev + (0 - prev) * (sCurr - sPrev) / (val - prev);
                                    breakEvens.push(zeroS);
                                }
                            }

                            // 2. Identify Inflection Points (Strategy Strikes)
                            const strategy = params.strategy || 'single';
                            const width = params.width || 10;
                            const K = Array.isArray(params.K) ? params.K[0] : params.K;
                            const inflections: number[] = [];

                            if (strategy === 'single' || strategy === 'straddle') {
                                inflections.push(K);
                            } else if (strategy === 'strangle') {
                                inflections.push(K - width);
                                inflections.push(K + width);
                            } else if (strategy === 'butterfly') {
                                inflections.push(K - width);
                                inflections.push(K);
                                inflections.push(K + width);
                            } else if (strategy === 'iron_condor') {
                                inflections.push(K - 2 * width);
                                inflections.push(K - width);
                                inflections.push(K + width);
                                inflections.push(K + 2 * width);
                            }

                            const chartOption: any = {
                                backgroundColor: 'transparent',
                                title: { text: '到期盈亏图 (Expiry P&L)', left: 'center', textStyle: { color: '#e5e7eb' } },
                                tooltip: {
                                    trigger: 'axis',
                                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                    textStyle: { color: '#f3f4f6' },
                                    formatter: (params: any) => {
                                        if (!params[0]) return '';
                                        const p = params[0];
                                        return `Price: ${p.value[0].toFixed(2)}<br/>P&L: ${p.value[1].toFixed(2)}`;
                                    }
                                },
                                grid: { top: 60, right: 30, bottom: 30, left: 60 },
                                xAxis: {
                                    type: 'value',
                                    min: 'dataMin',
                                    max: 'dataMax',
                                    axisLine: { lineStyle: { color: '#4b5563' } },
                                    axisLabel: { color: '#9ca3af', formatter: (v: number) => v.toFixed(2) },
                                    splitLine: { show: false }
                                },
                                yAxis: {
                                    type: 'value',
                                    splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
                                    axisLabel: { color: '#9ca3af' }
                                },
                                series: [{
                                    name: 'P&L',
                                    type: 'line',
                                    smooth: true,
                                    // Zip x and y for value axis
                                    data: xData.map((x, i) => [x, sData[i]]),
                                    lineStyle: { width: 3, color: '#60a5fa' },
                                    areaStyle: {
                                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                            { offset: 0, color: 'rgba(96, 165, 250, 0.5)' },
                                            { offset: 1, color: 'rgba(96, 165, 250, 0.0)' }
                                        ])
                                    },
                                    markLine: {
                                        symbol: 'none',
                                        animation: false,
                                        data: [
                                            // Zero line
                                            { yAxis: 0, lineStyle: { color: '#6b7280', width: 1, type: 'dashed' }, label: { show: false } },
                                            // Inflection Points (Strikes)
                                            ...inflections.map(inf => ({
                                                xAxis: inf,
                                                lineStyle: { color: '#10b981', width: 2, type: 'solid' },
                                                label: {
                                                    show: true,
                                                    position: 'end',
                                                    formatter: (p: any) => `K: ${p.value.toFixed(1)}`,
                                                    color: '#10b981',
                                                    fontWeight: 'bold'
                                                }
                                            })),
                                            // Break-Even Lines (Vertical)
                                            ...breakEvens.map(be => ({
                                                xAxis: be,
                                                lineStyle: { color: '#f59e0b', width: 2, type: 'dashed' },
                                                label: {
                                                    show: true,
                                                    position: 'insideStartBottom',
                                                    formatter: (p: any) => `BE:\n${p.value.toFixed(1)}`,
                                                    color: '#f59e0b',
                                                    fontWeight: 'bold',
                                                    lineHeight: 16
                                                }
                                            }))
                                        ]
                                    }
                                }]
                            };
                            return <Chart options={chartOption} height="100%" />;
                        })()}
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
                                {markerResults && markerResults.length > 0 && (
                                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                        <div className="bg-gray-900/90 border-l-2 border-yellow-500 p-2 rounded shadow-xl backdrop-blur-sm">
                                            {markerResults.length === 1 ? (
                                                <div className="text-xl font-bold text-white tracking-wide">
                                                    {markerResults[0].greeks[config.key as keyof GreeksResult]?.toFixed(4)}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    {markerResults.map((res, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                                            <span className="text-gray-400">{res.name}:</span>
                                                            <span className="font-mono font-bold text-white">
                                                                {res.greeks[config.key as keyof GreeksResult]?.toFixed(4)}
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

            {/* Strategy Legs Display */}
            <div className="mt-4">
                <StrategyLegs params={params} />
            </div>
        </div>
    );
};
