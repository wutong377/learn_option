export interface GreekDefinition {
    symbol: string;
    name: string;
    formula: string;
    latex: string;
    latexPut?: string;
    description: string;
}

export const GREEK_DEFINITIONS: Record<string, GreekDefinition> = {
    price: {
        symbol: 'C / P',
        name: '期权价格',
        formula: 'BS(S, K, t, σ, r)',
        latex: 'C = S e^{-q\\tau} N(d_1) - K e^{-r\\tau} N(d_2)',
        latexPut: 'P = K e^{-r\\tau} N(-d_2) - S e^{-q\\tau} N(-d_1)',
        description: '基于 Black-Scholes 模型计算的期权理论价值。'
    },
    delta: {
        symbol: 'Δ',
        name: 'Delta',
        formula: '∂V/∂S',
        latex: '\\Delta_c = e^{-q\\tau} N(d_1)',
        latexPut: '\\Delta_p = e^{-q\\tau} (N(d_1) - 1)',
        description: '期权价格对标的资产价格变动的敏感度。表示标的价格变动 1 单位时，期权价格的预期变动量。'
    },
    gamma: {
        symbol: 'Γ',
        name: 'Gamma',
        formula: '∂²V/∂S²',
        latex: '\\Gamma = \\frac{e^{-q\\tau} N\'(d_1)}{S \\sigma \\sqrt{\\tau}}',
        description: 'Delta 对标的资产价格变动的敏感度。衡量期权价格的凸性，即 Delta 随标的价格变化的速率。'
    },
    theta: {
        symbol: 'Θ',
        name: 'Theta',
        formula: '∂V/∂t',
        latex: '\\Theta_c = -\\frac{S e^{-q\\tau} N\'(d_1) \\sigma}{2\\sqrt{\\tau}} - r K e^{-r\\tau} N(d_2) + q S e^{-q\\tau} N(d_1)',
        latexPut: '\\Theta_p = -\\frac{S e^{-q\\tau} N\'(d_1) \\sigma}{2\\sqrt{\\tau}} + r K e^{-r\\tau} N(-d_2) - q S e^{-q\\tau} N(-d_1)',
        description: '期权价格对时间流逝的敏感度（时间衰减）。表示随时间推移，期权价值损耗的速度。'
    },
    vega: {
        symbol: 'ν',
        name: 'Vega',
        formula: '∂V/∂σ',
        latex: '\\nu = S e^{-q\\tau} \\sqrt{\\tau} N\'(d_1)',
        description: '期权价格对隐含波动率变动的敏感度。表示波动率变动 1% 时，期权价格的预期变动量。'
    },
    rho: {
        symbol: 'ρ',
        name: 'Rho',
        formula: '∂V/∂r',
        latex: '\\rho_c = K \\tau e^{-r\\tau} N(d_2)',
        latexPut: '\\rho_p = -K \\tau e^{-r\\tau} N(-d_2)',
        description: '期权价格对无风险利率变动的敏感度。'
    },
    vanna: {
        symbol: '',
        name: 'Vanna',
        formula: '∂²V / ∂S ∂σ',
        latex: '\\text{Vanna} = \\frac{-e^{-q\\tau} N\'(d_1) d_2}{\\sigma}',
        description: 'Delta 对波动率变动的敏感度（或 Vega 对标的价格变动的敏感度）。对于管理 Delta 对冲的波动率风险至关重要。'
    },
    charm: {
        symbol: '',
        name: 'Charm',
        formula: '- ∂²V / ∂S ∂t',
        latex: '\\text{Charm} = -e^{-q\\tau} [N\'(d_1) \\frac{2(r-q)\\tau - d_2 \\sigma \\sqrt{\\tau}}{2\\tau \\sigma \\sqrt{\\tau}} - q N(d_1)]',
        latexPut: '\\text{Charm} = e^{-q\\tau} [N\'(d_1) \\frac{2(r-q)\\tau - d_2 \\sigma \\sqrt{\\tau}}{2\\tau \\sigma \\sqrt{\\tau}} + q N(-d_1)]',
        description: 'Delta 随时间衰减的速度（Delta Decay）。衡量在维持对冲头寸时，Delta 随时间的动态变化。'
    },
    speed: {
        symbol: '',
        name: 'Speed',
        formula: '∂³V / ∂S³',
        latex: '\\text{Speed} = -\\frac{\\Gamma}{S} (\\frac{d_1}{\\sigma\\sqrt{\\tau}} + 1)',
        description: 'Gamma 对标的价格变动的敏感度。也称为 Gamma 的 Delta。'
    },
    color: {
        symbol: '',
        name: 'Color',
        formula: '∂³V / ∂S² ∂t',
        latex: '\\text{Color} = \\frac{\\partial^3 V}{\\partial S^2 \\partial t}',
        description: 'Gamma 随时间衰变的速度（Gamma Decay）。表示 Gamma 随时间推移的变化率。'
    },
    volga: {
        symbol: '',
        name: 'Volga (Vomma)',
        formula: '∂²V / ∂σ²',
        latex: '\\text{Volga} = \\nu \\frac{d_1 d_2}{\\sigma}',
        description: 'Vega 对波动率变动的敏感度。衡量 Vega 的凸性，即波动率变动如何影响 Vega 自身。'
    },
    zomma: {
        symbol: '',
        name: 'Zomma',
        formula: '∂³V / ∂S² ∂σ',
        latex: '\\text{Zomma} = \\Gamma \\frac{d_1 d_2 - 1}{\\sigma}',
        description: 'Gamma 对波动率变动的敏感度。衡量波动率变化对期权价格曲率的影响。'
    }
};
