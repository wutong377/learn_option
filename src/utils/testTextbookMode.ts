
import { BlackScholes } from './blackScholes';

// Params from textbook image
const S = 48.4;
const K = 44;
const days = 56;
const r = 0; // 0%
const sigma = 0.18; // 18%
const q = 0;

// Textbook Mode: T = days / 365
const t = days / 365;

const params = {
    S, K, t, sigma, r, q,
    isTextbookMode: true,
    tDiscount: t
};

console.log("Testing with Params:", params);

const callResult = BlackScholes.calculate(params, 'call');

console.log("\n--- Call Option Results ---");
console.log("Price (Target ~4.59):", callResult.price.toFixed(4));
console.log("Delta (Target ~0.92):", callResult.delta.toFixed(4));
console.log("Theta (Target ~-0.0046):", callResult.theta.toFixed(6));
console.log("Vega  (Target ~0.029):", callResult.vega.toFixed(4)); 
