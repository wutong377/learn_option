import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ChartProps {
    options: echarts.EChartsOption;
    height?: string | number;
    className?: string;
}

export const Chart: React.FC<ChartProps> = ({ options, height = '300px', className }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (!chartInstance.current) {
                chartInstance.current = echarts.init(chartRef.current, 'dark', {
                    renderer: 'canvas',
                });
            }

            chartInstance.current.setOption(options);
        }

        const handleResize = () => {
            chartInstance.current?.resize();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Don't dispose immediately to allow smooth updates, but in React strict mode with HMR, 
            // it might double init. Proper cleanup:
            // chartInstance.current?.dispose();
        };
    }, [options]);

    useEffect(() => {
        // Separate effect for cleanup on unmount only
        return () => {
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    return <div ref={chartRef} style={{ height, width: '100%' }} className={className} />;
};
