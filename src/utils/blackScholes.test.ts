
import { describe, it, expect } from 'vitest';
import { BlackScholes } from './blackScholes';

describe('BlackScholes Model', () => {

    it('Scenario 1: Textbook Example (Textbook Mode)', () => {
        // As per user textbook image
        const params = {
            S: 48.4,
            K: 44,
            t: 56 / 365,
            sigma: 0.18,
            r: 0,
            q: 0,
            isTextbookMode: true,
            tDiscount: 56 / 365
        };

        const result = BlackScholes.calculate(params, 'call');

        // Targets from textbook
        // Price: ~4.59 (with rate ~1%), ~4.53 (with rate 0%)
        // Delta: 0.92
        // Theta: -0.0046 (My code returns per day)
        // Vega: 0.029

        expect(result.delta).toBeCloseTo(0.9173, 3);
        expect(result.theta).toBeCloseTo(-0.0046, 4);
        expect(result.vega).toBeCloseTo(0.0289, 3);
        expect(result.price).toBeCloseTo(4.5325, 3);
    });

    it('Scenario 2: Standard ATM Call (1 Year)', () => {
        const params = {
            S: 100,
            K: 100,
            t: 1.0,
            sigma: 0.2,
            r: 0.05,
            q: 0,
            isTextbookMode: false // Standard Mode
        };

        const result = BlackScholes.calculate(params, 'call');

        // N(d1) check logic roughly
        // d1 = (ln(1) + (0.05 + 0.02) * 1) / 0.2 = 0.07 / 0.2 = 0.35
        // N(0.35) approx 0.6368
        // Price should be ~ 10.45 

        expect(result.price).toBeGreaterThan(10.0);
        expect(result.price).toBeLessThan(11.0);
        expect(result.delta).toBeGreaterThan(0.5); // ATM Call > 0.5 usually due to drift
    });

    it('Scenario 3: Put-Call Parity', () => {
        // C - P = S * e^-qT - K * e^-rT
        const params = {
            S: 100,
            K: 95,
            t: 0.5,
            sigma: 0.25,
            r: 0.03,
            q: 0.01,
            isTextbookMode: false
        };

        const call = BlackScholes.calculate(params, 'call');
        const put = BlackScholes.calculate(params, 'put');

        const lhs = call.price - put.price;
        const rhs = params.S * Math.exp(-params.q * params.t) - params.K * Math.exp(-params.r * params.t);

        expect(lhs).toBeCloseTo(rhs, 5);
    });

    it('Scenario 4: Dividend Impact', () => {
        // Higher q should lower Call price
        const base = {
            S: 100, K: 100, t: 1, sigma: 0.2, r: 0.05, isTextbookMode: true
        };

        const callNoDiv = BlackScholes.calculate({ ...base, q: 0 }, 'call');
        const callWithDiv = BlackScholes.calculate({ ...base, q: 0.05 }, 'call');

        expect(callWithDiv.price).toBeLessThan(callNoDiv.price);
    });
});
