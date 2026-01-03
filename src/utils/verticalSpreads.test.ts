
import { describe, it, expect } from 'vitest';
import { BlackScholes, SimulationParams } from './blackScholes';
import { getStrategyLegs } from './strategyDefinitions';
import { OptionParams } from '../types';

describe('Vertical Spread Strategies', () => {
    const baseParams: OptionParams = {
        S: 100, K: 100, t: 1, sigma: 0.2, r: 0.05, q: 0,
        isTextbookMode: true,
        type: 'call', // Initial type
        width: 10,
        width2: 10,
        strategy: 'single'
    };

    const calcPrice = (legs: any[], S: number) => {
        let price = 0;
        legs.forEach(leg => {
            const p: SimulationParams = {
                S, K: leg.k, t: leg.t, sigma: leg.sigma, r: leg.r, q: 0, isTextbookMode: true
            };
            const res = BlackScholes.calculate(p, leg.type);
            price += res.price * leg.quantity;
        });
        return price;
    };

    it('Vertical Call Spread (Long / Bull)', () => {
        // Strategy: Long Call 100, Short Call 110
        // Expect: Positive Cost (Debit)
        // Profit rises as S increases
        const params = { ...baseParams, strategy: 'vertical_call_spread' as const, type: 'call' as const };
        const legs = getStrategyLegs(params);

        expect(legs).toHaveLength(2);
        // Leg 1: Long Call 100
        expect(legs[0]).toMatchObject({ type: 'call', k: 100, quantity: 1 });
        // Leg 2: Short Call 110
        expect(legs[1]).toMatchObject({ type: 'call', k: 110, quantity: -1 });

        // Check Debit
        const cost = calcPrice(legs, 100);
        expect(cost).toBeGreaterThan(0); // Debit spread

        // Check Profit Profile (Expiry approx)
        // At S=120, Value ~ 10. Profit ~ 10 - cost
        // We use t=0.001 to simulate expiry
        legs.forEach(l => l.t = 0.001);

        const valAtMax = calcPrice(legs, 130);
        expect(valAtMax).toBeCloseTo(10, 1);

        const valAtMin = calcPrice(legs, 80);
        expect(valAtMin).toBeCloseTo(0, 1);
    });

    it('Vertical Put Spread (Long / Bear)', () => {
        // Strategy: Long Put 100, Short Put 90 (Width=10)
        // Note: Code uses K - Width for 2nd leg
        // Expect: Positive Cost (Debit)
        // Profit rises as S decreases
        const params = { ...baseParams, strategy: 'vertical_put_spread' as const, type: 'call' as const };
        // Note: type='call' -> baseQty=1 (Long Strategy). 
        // For Vertical Put Spread, "Long" means buying the spread (Debit).

        const legs = getStrategyLegs(params);

        expect(legs).toHaveLength(2);
        // Leg 1: Long Put 100
        expect(legs[0]).toMatchObject({ type: 'put', k: 100, quantity: 1 });
        // Leg 2: Short Put 90 (100 - 10)
        expect(legs[1]).toMatchObject({ type: 'put', k: 90, quantity: -1 });

        const cost = calcPrice(legs, 100);
        expect(cost).toBeGreaterThan(0); // Debit

        // Check Profile at expiry
        legs.forEach(l => l.t = 0.001);

        // At S=80 (Below both strikes), Value = (100-80) - (90-80) = 20 - 10 = 10.
        const valAtMaxProfit = calcPrice(legs, 80);
        expect(valAtMaxProfit).toBeCloseTo(10, 1);

        // At S=120 (Above both), Value = 0
        const valAtMin = calcPrice(legs, 120);
        expect(valAtMin).toBeCloseTo(0, 1);
    });
});
