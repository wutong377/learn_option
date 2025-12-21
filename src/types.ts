export type OptionType = 'call' | 'put';

export interface OptionParams {
    S: number | number[];
    K: number | number[];
    t: number | number[];
    tDiscount?: number | number[]; // Time to expiration (Calendar)
    sigma: number | number[];
    r: number | number[];
    type: OptionType;
}

export const DEFAULT_PARAMS: OptionParams = {
    S: 100,
    K: 100,
    t: 30 / 252,
    sigma: 0.2,
    r: 0.05,
    type: 'call',
};
