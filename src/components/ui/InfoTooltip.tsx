import React from 'react';
import { Info } from 'lucide-react';
import { GREEK_DEFINITIONS } from '../../utils/definitions';

interface InfoTooltipProps {
    greekKey: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ greekKey }) => {
    const def = GREEK_DEFINITIONS[greekKey];

    if (!def) return null;

    return (
        <div className="relative group z-50">
            <div className="bg-gray-700 p-1.5 rounded-full cursor-help hover:bg-gray-600 transition-colors">
                <Info className="w-4 h-4 text-gray-400 group-hover:text-white" />
            </div>

            {/* Tooltip Popup */}
            <div className="absolute right-0 top-8 w-64 bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform group-hover:translate-y-0 translate-y-1">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-100">{def.name} <span className="text-gray-500 font-serif italic ml-1">{def.symbol}</span></h3>
                </div>
                <div className="mb-2 bg-gray-800 p-2 rounded text-center">
                    <code className="text-teal-400 font-mono text-sm">{def.formula}</code>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    {def.description}
                </p>
            </div>
        </div>
    );
};
