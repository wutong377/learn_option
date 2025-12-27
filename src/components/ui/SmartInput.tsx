import React, { useState, useEffect } from 'react';

interface SmartInputProps {
    label: string;
    value: number | number[];
    min: number;
    max: number;
    step: number;
    onChange: (val: number | number[]) => void;
    formatValue?: (val: number) => string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    formatValue = (v) => v.toFixed(2),
}) => {
    // Local state for the text input to allow free typing
    const [textValue, setTextValue] = useState('');

    useEffect(() => {
        if (Array.isArray(value)) {
            setTextValue(value.join(', '));
        } else {
            setTextValue(value.toString());
        }
    }, [value]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setTextValue(input);

        // Try parsing
        // Allow commas and spaces
        if (input.trim() === '') return;

        const parts = input.split(/[,，]/).map(s => s.trim()).filter(s => s !== '');

        // If multiple valid numbers
        const numbers: number[] = [];
        let allValid = true;

        for (const p of parts) {
            const n = parseFloat(p);
            if (!isNaN(n)) {
                numbers.push(n);
            } else {
                allValid = false;
            }
        }

        if (allValid && numbers.length > 0) {
            if (numbers.length === 1) {
                onChange(numbers[0]);
            } else {
                onChange(numbers);
            }
        }
    };

    // Slider only works if value is scalar
    const isScalar = !Array.isArray(value);
    const scalarValue = isScalar ? (value as number) : (value as number[])[0];

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        onChange(val);
    };

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-300">{label}</label>
                <span className="text-xs font-mono text-gray-500">
                    {Array.isArray(value) ? `${value.length} values` : formatValue(value as number)}
                </span>
            </div>

            <div className="flex gap-2 items-center">
                {/* Slider (Disabled if multi-value mode? or just controls the first value?) 
                    Let's disable slider in multi-value mode to avoid confusion, 
                    or render a slider that resets it to single value.
                */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={scalarValue}
                    onChange={handleSliderChange}
                    className={`flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 ${!isScalar ? 'opacity-50' : ''}`}
                />

                {/* Text Input */}
                <input
                    type="text"
                    value={textValue}
                    onChange={handleTextChange}
                    className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none text-right"
                    placeholder="Value(s)"
                />
            </div>
        </div>
    );
};
