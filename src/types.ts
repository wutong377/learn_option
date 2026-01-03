export type OptionType = 'call' | 'put';
export type StrategyType = 'single' | 'straddle' | 'strangle' | 'butterfly' | 'iron_condor' | 'ratio_spread' | 'calendar_spread' | 'diagonal_spread' | 'time_butterfly' | 'vertical_call_spread' | 'vertical_put_spread' | 'custom';

export interface LegDefinition {
    type: 'call' | 'put';
    quantity: number; // >0 Long, <0 Short
    store_quantity?: number; // Store the quantity for custom strategy, to keep track of sign
    k: number;
    t: number; // Trading years
    tDiscount?: number; // Calendar years
    sigma: number;
    r: number;
}

export interface OptionParams {
    S: number | number[];
    K: number | number[];
    t: number | number[];
    tDiscount?: number | number[]; // Time to expiration (Calendar)
    sigma: number | number[];
    r: number | number[];
    type: OptionType;
    // Strategy Params
    strategy?: StrategyType;
    width?: number; // Spread width (Primary)
    width2?: number; // Spread width (Secondary, e.g. for asymmetric butterfly)
    timeDiff?: number; // Time difference in days (for calendar/diagonal)
    customLegs?: LegDefinition[]; // For Custom Strategy
    q?: number | number[]; // Dividend Yield
    isTextbookMode?: boolean; // If true, t = Calendar Days / 365, and Theta matches textbook
}

// Re-defining OptionParams to be safe with replace_file_content context matching
// Correction: I should target the specific lines to avoid redefining everything if possible, but adding an interface in the middle might be tricky if I don't replace the whole block.
// Let's just modify StrategyType and OptionParams.

// Actually, I'll allow replace_file_content to handle the replacement.
// StrategyType line 2.
// OptionParams line 4-17.

export const DEFAULT_PARAMS: OptionParams = {
    S: 100,
    K: 100,
    t: 30 / 252,
    sigma: 0.2,
    r: 0.05,
    type: 'call',
    strategy: 'single',
    width: 10,
    q: 0,
    isTextbookMode: true,
};
