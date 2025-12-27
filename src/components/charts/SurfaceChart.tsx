import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-gl';

interface SurfaceChartProps {
    data: [number, number, number][];
    zLabel: string;
    minS: number;
    maxS: number;
    minT: number;
    maxT: number;
    breakEvenLine?: [number, number, number][];
    height?: string | number;
}

export const SurfaceChart: React.FC<SurfaceChartProps> = ({
    data,
    zLabel,
    minS,
    maxS,
    minT,
    maxT,
    breakEvenLine,
    height = '600px',
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (!chartInstance.current) {
                chartInstance.current = echarts.init(chartRef.current, 'dark');
            }

            const seriesList: any[] = [{
                type: 'surface',
                wireframe: {
                    show: true,
                    lineStyle: { color: 'rgba(255,255,255,0.1)' }
                },
                shading: 'color',
                data: data.map(d => [d[0], d[1] * 252, d[2]]),
                itemStyle: {
                    opacity: 0.9
                }
            }];

            if (breakEvenLine && breakEvenLine.length > 0) {
                seriesList.push({
                    type: 'scatter3D',
                    name: 'Break-Even',
                    data: breakEvenLine.map(d => [d[0], d[1] * 252, d[2] + 0.1]), // Lift slightly to be visible? Or z=0 is fine.
                    symbolSize: 3,
                    itemStyle: {
                        color: '#fff',
                        opacity: 1
                    },
                    tooltip: {
                        formatter: (params: any) => {
                            return `Break-Even<br/>S: ${params.value[0].toFixed(2)}<br/>T: ${params.value[1].toFixed(1)}d`;
                        }
                    }
                });
            }

            const option: any = {
                backgroundColor: 'transparent',
                tooltip: {
                    formatter: (params: any) => {
                        if (params.seriesType === 'scatter3D') return params.data.tooltip || '';
                        const [x, y, z] = params.value;
                        return `
                            <div style="font-size: 12px; line-height: 1.5;">
                                <div><strong>标的价格 (S):</strong> ${x.toFixed(2)}</div>
                                <div><strong>时间 (Time):</strong> ${y.toFixed(1)} Days</div>
                                <div><strong>${zLabel}:</strong> ${z.toFixed(4)}</div>
                            </div>
                        `;
                    }
                },
                title: {
                    text: `${zLabel} 曲面图 (Spot vs Time)`,
                    left: 'center',
                    textStyle: { color: '#e5e7eb' }
                },
                visualMap: {
                    show: true,
                    dimension: 2,
                    min: Math.min(...data.map(d => d[2])),
                    max: Math.max(...data.map(d => d[2])),
                    inRange: {
                        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
                    },
                    textStyle: { color: '#fff' }
                },
                xAxis3D: {
                    type: 'value',
                    name: '价格 (S)',
                    min: minS,
                    max: maxS,
                    nameTextStyle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
                    axisLabel: { textStyle: { color: '#ffffff', fontSize: 12 }, margin: 8 },
                    axisLine: { lineStyle: { color: '#6b7280' } },
                    axisPointer: { show: true, lineStyle: { color: 'rgba(255,255,255,0.5)', width: 1 } }
                },
                yAxis3D: {
                    type: 'value',
                    name: '时间 (Days)',
                    min: minT * 252,
                    max: maxT * 252,
                    nameTextStyle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
                    axisLabel: {
                        textStyle: { color: '#ffffff', fontSize: 12 },
                        margin: 8,
                        formatter: (val: number) => val.toFixed(0)
                    },
                    axisLine: { lineStyle: { color: '#6b7280' } },
                    axisPointer: { show: true, lineStyle: { color: 'rgba(255,255,255,0.5)', width: 1 } }
                },
                zAxis3D: {
                    type: 'value',
                    name: zLabel,
                    nameTextStyle: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
                    axisLabel: { textStyle: { color: '#ffffff', fontSize: 12 }, margin: 8 },
                    axisLine: { lineStyle: { color: '#6b7280' } },
                    axisPointer: { show: true, lineStyle: { color: 'rgba(255,255,255,0.5)', width: 1 } }
                },
                grid3D: {
                    viewControl: {
                        projection: 'perspective',
                        autoRotate: false,
                        rotateSensitivity: 1,
                        zoomSensitivity: 1,
                        panSensitivity: 1
                    },
                    boxWidth: 200,
                    boxDepth: 80,
                    light: {
                        main: {
                            intensity: 1.2,
                            shadow: true
                        },
                        ambient: {
                            intensity: 0.3
                        }
                    },
                    environment: 'auto'
                },
                series: seriesList
            };

            chartInstance.current.setOption(option, true); // true to merge/replace carefully? No, usually true avoids merging issues.
            // Actually 'notMerge' is the second arg. setOption(option, {notMerge: true})
            chartInstance.current.setOption(option);
        }

        const handleResize = () => chartInstance.current?.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, [data, zLabel, minS, maxS, minT, maxT, breakEvenLine]);

    return <div ref={chartRef} style={{ height, width: '100%' }} />;
};
