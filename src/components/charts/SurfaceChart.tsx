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
    height?: string | number;
}

export const SurfaceChart: React.FC<SurfaceChartProps> = ({
    data,
    zLabel,
    minS,
    maxS,
    minT,
    maxT,
    height = '600px',
}) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (!chartInstance.current) {
                chartInstance.current = echarts.init(chartRef.current, 'dark');
            }

            const option: any = {
                backgroundColor: 'transparent',
                tooltip: {},
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
                    axisLabel: { textStyle: { color: '#ccc' } }
                },
                yAxis3D: {
                    type: 'value',
                    name: '时间 (Days)',
                    min: minT * 252,
                    max: maxT * 252,
                    axisLabel: {
                        textStyle: { color: '#ccc' },
                        formatter: (val: number) => val.toFixed(0)
                    }
                },
                zAxis3D: {
                    type: 'value',
                    name: zLabel,
                    axisLabel: { textStyle: { color: '#ccc' } }
                },
                grid3D: {
                    viewControl: {
                        projection: 'perspective',
                        autoRotate: true,
                        autoRotateSpeed: 5
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
                    }
                },
                series: [{
                    type: 'surface',
                    wireframe: {
                        show: false
                    },
                    shading: 'color',
                    // Data is [S, t, z]. Map t to t*252 for days
                    data: data.map(d => [d[0], d[1] * 252, d[2]]),
                    itemStyle: {
                        opacity: 0.8
                    }
                }]
            };

            chartInstance.current.setOption(option);
        }

        const handleResize = () => chartInstance.current?.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, [data, zLabel, minS, maxS, minT, maxT]);

    return <div ref={chartRef} style={{ height, width: '100%' }} />;
};
