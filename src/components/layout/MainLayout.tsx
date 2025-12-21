import React from 'react';
import { OptionParams } from '../../types';
import { ControlPanel } from '../controls/ControlPanel';

interface MainLayoutProps {
    params: OptionParams;
    setParams: (p: OptionParams) => void;
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ params, setParams, children }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col lg:flex-row p-4 gap-4">
            <ControlPanel params={params} onChange={setParams} />
            <main className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700/50 p-6 overflow-hidden flex flex-col">
                {children}
            </main>
        </div>
    );
};
