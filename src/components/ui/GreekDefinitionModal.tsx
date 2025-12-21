import React, { useEffect, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';
import { GREEK_DEFINITIONS } from '../../utils/definitions';

interface GreekDefinitionModalProps {
    greekKey: string | null;
    onClose: () => void;
}

export const GreekDefinitionModal: React.FC<GreekDefinitionModalProps> = ({ greekKey, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        // Close on click outside
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (greekKey) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [greekKey, onClose]);

    if (!greekKey) return null;

    const def = GREEK_DEFINITIONS[greekKey];
    if (!def) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div
                ref={modalRef}
                className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{def.name}</h3>
                            <p className="text-sm text-gray-400 font-serif italic">{def.symbol}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">数学公式 / Formula</label>
                        <code className="text-teal-400 font-mono text-lg block text-center py-2">{def.formula}</code>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">定义 / Definition</label>
                        <p className="text-gray-300 leading-relaxed text-sm lg:text-base">
                            {def.description}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-900/30 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};
