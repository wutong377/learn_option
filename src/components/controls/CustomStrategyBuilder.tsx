import React from 'react';
import { OptionParams, LegDefinition } from '../../types';
import { Trash2, Plus, Info } from "lucide-react";

interface CustomStrategyBuilderProps {
    params: OptionParams;
    onChange: (legs: LegDefinition[]) => void;
}

export const CustomStrategyBuilder: React.FC<CustomStrategyBuilderProps> = ({ params, onChange }) => {
    // We maintain local state for legs, or use params.customLegs?
    // Using params directly is better for top-down data flow.
    const legs = params.customLegs || [];

    const handleAddLeg = () => {
        const newLeg: LegDefinition = {
            type: 'call',
            quantity: 1,
            k: Array.isArray(params.K) ? params.K[0] : params.K,
            t: Array.isArray(params.t) ? params.t[0] : params.t,
            tDiscount: undefined, // undefined means use t logic
            sigma: Array.isArray(params.sigma) ? params.sigma[0] : params.sigma,
            r: Array.isArray(params.r) ? params.r[0] : params.r,
        };
        onChange([...legs, newLeg]);
    };

    const handleRemoveLeg = (idx: number) => {
        const newLegs = [...legs];
        newLegs.splice(idx, 1);
        onChange(newLegs);
    };

    const handleUpdateLeg = (idx: number, updates: Partial<LegDefinition>) => {
        const newLegs = [...legs];
        newLegs[idx] = { ...newLegs[idx], ...updates };
        onChange(newLegs);
    };

    return (
        <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">自定义策略腿 (Custom Legs)</label>
                <button
                    onClick={handleAddLeg}
                    className="h-7 text-xs border border-green-700 text-green-400 hover:bg-green-900/30 px-3 rounded flex items-center transition-colors"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    添加 (Add)
                </button>
            </div>

            {legs.length === 0 && (
                <div className="text-center p-4 border border-dashed border-gray-700 rounded-lg text-gray-500 text-sm">
                    暂无策略腿，请点击添加。
                </div>
            )}

            <div className="space-y-2">
                {legs.map((leg, idx) => (
                    <div key={idx} className="p-2 rounded bg-gray-800 border border-gray-700 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            {/* Action: Buy/Sell */}
                            <div className="flex rounded overflow-hidden border border-gray-600 text-xs">
                                <button
                                    className={`px-2 py-1 transition-colors ${leg.quantity > 0 ? 'bg-green-900 text-green-400 font-bold' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                    onClick={() => handleUpdateLeg(idx, { quantity: Math.abs(leg.quantity) })}
                                >
                                    Buy
                                </button>
                                <button
                                    className={`px-2 py-1 transition-colors ${leg.quantity < 0 ? 'bg-red-900 text-red-400 font-bold' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                    onClick={() => handleUpdateLeg(idx, { quantity: -Math.abs(leg.quantity) })}
                                >
                                    Sell
                                </button>
                            </div>

                            {/* Type: Call/Put */}
                            <div className="flex rounded overflow-hidden border border-gray-600 text-xs">
                                <button
                                    className={`px-2 py-1 transition-colors ${leg.type === 'call' ? 'bg-blue-900 text-blue-400 font-bold' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                    onClick={() => handleUpdateLeg(idx, { type: 'call' })}
                                >
                                    Call
                                </button>
                                <button
                                    className={`px-2 py-1 transition-colors ${leg.type === 'put' ? 'bg-purple-900 text-purple-400 font-bold' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                    onClick={() => handleUpdateLeg(idx, { type: 'put' })}
                                >
                                    Put
                                </button>
                            </div>

                            <div className="flex-1" />

                            <button className="h-6 w-6 text-gray-500 hover:text-red-400 flex items-center justify-center transition-colors" onClick={() => handleRemoveLeg(idx)}>
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Params Row */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-500 text-[10px]">数量 (Qty)</span>
                                <input
                                    type="number"
                                    className="bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-white"
                                    value={Math.abs(leg.quantity)}
                                    min={1}
                                    step={1}
                                    onChange={(e) => {
                                        const newQty = parseFloat(e.target.value);
                                        const sign = leg.quantity >= 0 ? 1 : -1;
                                        handleUpdateLeg(idx, { quantity: newQty * sign });
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-500 text-[10px]">行权价 (Strike)</span>
                                <input
                                    type="number"
                                    className="bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-white"
                                    value={leg.k}
                                    onChange={(e) => handleUpdateLeg(idx, { k: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-xs text-gray-500 mt-2 flex gap-1 bg-blue-900/20 p-2 rounded">
                <Info className="w-3 h-3 mt-0.5" />
                <span>自定义策略的行权价将作为**绝对值(Absolute)**参与计算，不会虽主滑块 $K$ 移动。</span>
            </div>
        </div>
    );
};
