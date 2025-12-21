export interface GreekDefinition {
    symbol: string;
    name: string;
    formula: string;
    description: string;
}

export const GREEK_DEFINITIONS: Record<string, GreekDefinition> = {
    price: {
        symbol: 'C / P',
        name: '期权价格',
        formula: 'BS(S, K, t, σ, r)',
        description: '基于 Black-Scholes 模型计算的期权理论价值。'
    },
    delta: {
        symbol: 'Δ',
        name: 'Delta',
        formula: '∂V/∂S',
        description: '期权价格对标的资产价格变动的敏感度。表示标的价格变动 1 单位时，期权价格的预期变动量。'
    },
    gamma: {
        symbol: 'Γ',
        name: 'Gamma',
        formula: '∂²V/∂S²',
        description: 'Delta 对标的资产价格变动的敏感度。衡量期权价格的凸性，即 Delta 随标的价格变化的速率。'
    },
    theta: {
        symbol: 'Θ',
        name: 'Theta',
        formula: '∂V/∂t',
        description: '期权价格对时间流逝的敏感度（时间衰减）。表示随时间推移，期权价值损耗的速度。'
    },
    vega: {
        symbol: 'ν',
        name: 'Vega',
        formula: '∂V/∂σ',
        description: '期权价格对隐含波动率变动的敏感度。表示波动率变动 1% 时，期权价格的预期变动量。'
    },
    rho: {
        symbol: 'ρ',
        name: 'Rho',
        formula: '∂V/∂r',
        description: '期权价格对无风险利率变动的敏感度。'
    },
    vanna: {
        symbol: '',
        name: 'Vanna',
        formula: '∂²V / ∂S ∂σ',
        description: 'Delta 对波动率变动的敏感度（或 Vega 对标的价格变动的敏感度）。对于管理 Delta 对冲的波动率风险至关重要。'
    },
    charm: {
        symbol: '',
        name: 'Charm',
        formula: '- ∂²V / ∂S ∂t',
        description: 'Delta 随时间衰减的速度（Delta Decay）。衡量在维持对冲头寸时，Delta 随时间的动态变化。'
    },
    speed: {
        symbol: '',
        name: 'Speed',
        formula: '∂³V / ∂S³',
        description: 'Gamma 对标的价格变动的敏感度。也称为 Gamma 的 Delta。'
    },
    color: {
        symbol: '',
        name: 'Color',
        formula: '∂³V / ∂S² ∂t',
        description: 'Gamma 随时间衰变的速度（Gamma Decay）。表示 Gamma 随时间推移的变化率。'
    },
    volga: {
        symbol: '',
        name: 'Volga (Vomma)',
        formula: '∂²V / ∂σ²',
        description: 'Vega 对波动率变动的敏感度。衡量 Vega 的凸性，即波动率变动如何影响 Vega 自身。'
    },
    zomma: {
        symbol: '',
        name: 'Zomma',
        formula: '∂³V / ∂S² ∂σ',
        description: 'Gamma 对波动率变动的敏感度。衡量波动率变化对期权价格曲率的影响。'
    }
};
