import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
    formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    formatValue = (v) => v.toFixed(2),
}) => {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <span className="text-sm font-mono text-blue-400">{formatValue(value)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            />
        </div>
    );
};
