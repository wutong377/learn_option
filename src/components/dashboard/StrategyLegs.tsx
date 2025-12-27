import React from 'react';
import { getStrategyLegs } from '../../utils/strategyDefinitions';
import { OptionParams } from '../../types';

interface StrategyLegsProps {
    params: OptionParams;
}

export const StrategyLegs: React.FC<StrategyLegsProps> = ({ params }) => {
    // Generate legs based on current params
    const legs = getStrategyLegs(params);

    if (legs.length === 0) return null;

    return (
        <div className="p-4 bg-gray-900 border-gray-800 rounded-lg border">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">策略构成 (Strategy Legs)</h3>
            <div className="space-y-2">
                {legs.map((leg, idx) => {
                    const isLong = leg.quantity > 0;
                    const qty = Math.abs(leg.quantity);
                    const typeLabel = leg.type === 'call' ? 'Call' : 'Put';

                    // Format Expiry
                    // leg.t is Years.
                    // If leg.t matches params.t (Base), allow showing days if available.

                    return (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-gray-800/50">
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isLong ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                    {isLong ? 'Buy' : 'Sell'} {qty}x
                                </span>
                                <span className="font-mono text-white">
                                    {typeLabel}
                                </span>
                                <span className="text-gray-400">@</span>
                                <span className="font-mono text-yellow-500">
                                    {leg.k.toFixed(2)}
                                </span>
                            </div>
                            <div className="text-gray-500 text-xs text-right">
                                <div>{(leg.t * 365).toFixed(0)}d</div>
                                <div>IV: {(leg.sigma * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
