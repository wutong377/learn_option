import React, { useEffect, useState } from 'react';
import { OptionParams, OptionType } from '../../types';
import { SmartInput } from '../ui/SmartInput';
import { Settings2, Calendar } from 'lucide-react';
import { calculateDays, getToday } from '../../utils/dateUtils';
import { addDays, format } from 'date-fns';

interface ControlPanelProps {
    params: OptionParams;
    onChange: (newParams: OptionParams) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ params, onChange }) => {
    const [expiryDate, setExpiryDate] = useState<string>('');

    // Sync expiry date on mount or when t changes significantly (optional, but good for consistency)
    // Sync expiry date on mount or when t changes significantly (optional, but good for consistency)
    useEffect(() => {
        // Default init if empty, calculate from current params.tDiscount or params.t
        if (!expiryDate) {
            const today = getToday();
            // Use tDiscount (Calendar Year) if available, otherwise t (Trading Year)
            // Note: t is trading years (252 days), tDiscount is calendar years (365 days)
            // We want calendar days.
            let daysRemaining = 30; // Fallback

            const tVal = params.tDiscount !== undefined ? params.tDiscount : params.t;
            // Handle array case (take first value)
            const scalarT = Array.isArray(tVal) ? tVal[0] : tVal;

            if (scalarT !== undefined) {
                daysRemaining = Math.round(scalarT * 365);
            }

            setExpiryDate(format(addDays(today, daysRemaining), 'yyyy-MM-dd'));
        }
    }, []);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        setExpiryDate(dateStr);
        if (dateStr) {
            const { calendarDays, tradingDays } = calculateDays(dateStr);
            onChange({
                ...params,
                t: tradingDays / 252,
                tDiscount: calendarDays / 365
            });
        }
    };

    const handleNaturalDaysChange = (v: number | number[]) => {
        if (Array.isArray(v)) {
            const tVals: number[] = [];
            const tDiscVals: number[] = [];
            const today = getToday();
            v.forEach(d => {
                const date = addDays(today, Math.round(d));
                const { calendarDays, tradingDays } = calculateDays(format(date, 'yyyy-MM-dd'));
                tVals.push(tradingDays / 252);
                tDiscVals.push(calendarDays / 365);
            });
            onChange({ ...params, t: tVals, tDiscount: tDiscVals });
        } else {
            const days = v;
            const date = addDays(getToday(), Math.round(days));
            const dateStr = format(date, 'yyyy-MM-dd');
            setExpiryDate(dateStr);

            const { calendarDays, tradingDays } = calculateDays(dateStr);
            onChange({
                ...params,
                t: tradingDays / 252,
                tDiscount: calendarDays / 365
            });
        }
    };

    // Helper to extract CURRENT natural days from params for display
    const currentNaturalDays = () => {
        // We reverse calculate from tDiscount (Calendar Time) if available, else t (Trading)
        // Ideally we trust tDiscount * 365
        const val = params.tDiscount !== undefined ? params.tDiscount : params.t; // Fallback to t if tDiscount missing

        if (Array.isArray(val)) {
            return val.map(v => parseFloat((v * 365).toFixed(1))); // Show decimals if any
        }
        return parseFloat(((val as number) * 365).toFixed(1));
    };

    const toPercent = (v: number | number[]) => {
        if (Array.isArray(v)) return v.map(d => parseFloat((d * 100).toFixed(2)));
        return parseFloat((v * 100).toFixed(2));
    };

    const fromPercent = (v: number | number[]) => {
        if (Array.isArray(v)) return v.map(d => d / 100);
        return (v as number) / 100;
    };

    const handleChange = (key: keyof OptionParams, value: number | number[] | OptionType) => {
        onChange({ ...params, [key]: value });
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl w-full lg:w-80 flex-shrink-0 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700">
                <Settings2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">模型参数</h2>
            </div>

            <div className="space-y-6">

                <div className="space-y-4 border-b border-gray-700 pb-4 mb-4">
                    <label className="text-sm font-medium text-gray-300 block mb-2">策略类型 (Strategy)</label>
                    <select
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                        value={params.strategy || 'single'}
                        onChange={(e) => handleChange('strategy', e.target.value as any)}
                    >
                        <option value="single">单腿期权 (Single)</option>
                        <option value="straddle">跨式 (Straddle)</option>
                        <option value="strangle">宽跨式 (Strangle)</option>
                        <option value="butterfly">蝶式 (Butterfly)</option>
                        <option value="iron_condor">鹰式 (Iron Condor)</option>
                    </select>

                    {params.strategy !== 'single' && (
                        <SmartInput
                            label="价差宽度 (Width)"
                            value={params.width || 10}
                            min={1}
                            max={50}
                            step={1}
                            onChange={(v) => handleChange('width', v)}
                        />
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                        {params.strategy === 'single' ? '期权类型' : '方向 (Direction)'}
                    </label>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => handleChange('type', 'call')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${params.type === 'call'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {params.strategy === 'single' ? '看涨 (Call)' : '做多 (Long)'}
                        </button>
                        <button
                            onClick={() => handleChange('type', 'put')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${params.type === 'put'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {params.strategy === 'single' ? '看跌 (Put)' : '做空 (Short)'}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" /> 到期日 (Expiry)
                    </label>
                    <input
                        type="date"
                        value={expiryDate}
                        onChange={handleDateChange}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                <SmartInput
                    label="标的价格 (Spot)"
                    value={params.S}
                    min={10}
                    max={300}
                    step={1}
                    onChange={(v) => handleChange('S', v)}
                />

                <SmartInput
                    label="执行价格 (Strike)"
                    value={params.K}
                    min={10}
                    max={300}
                    step={1}
                    onChange={(v) => handleChange('K', v)}
                />

                <SmartInput
                    label="剩余天数 (Natural Days)"
                    value={currentNaturalDays()}
                    min={1}
                    max={756}
                    step={1}
                    onChange={(v) => handleNaturalDaysChange(v)}
                    formatValue={(v) => `${v.toFixed(0)} 天`}
                />

                <SmartInput
                    label="波动率 (σ %)"
                    value={toPercent(params.sigma)}
                    min={1}
                    max={200}
                    step={1}
                    onChange={(v) => handleChange('sigma', fromPercent(v))}
                    formatValue={(v) => `${v.toFixed(0)}%`}
                />

                <SmartInput
                    label="无风险利率 (r %)"
                    value={toPercent(params.r)}
                    min={0}
                    max={20}
                    step={0.1}
                    onChange={(v) => handleChange('r', fromPercent(v))}
                    formatValue={(v) => `${v.toFixed(1)}%`}
                />
            </div>

            <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-400 leading-relaxed">
                    支持多值对比：在输入框中使用逗号分隔数字（如 30, 60）即可画出多条曲线。
                </p>
            </div>
        </div>
    );
};
