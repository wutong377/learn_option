
// Simplified test script to match the textbook example
const { BlackScholes } = require('./blackScholes');

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
console.log("Theta (Target ~-0.0046 per day?):", callResult.theta.toFixed(6));
// Note: Textbook Theta might be per day or per year. 
// User said -0.0046. My code returns Theta per day.
// Let's check what -0.0046 corresponds to.
// If it's -0.0046 per day, then per year it is ~ -1.679.
// If my code returns per day, it should be close.

console.log("Vega  (Target ~0.029 per %):", callResult.vega.toFixed(4));
// User said 0.029. My code returns Vega per 1% vol.

// Check Put just in case
const putResult = BlackScholes.calculate(params, 'put');
console.log("\n--- Put Option Results ---");
console.log("Price:", putResult.price.toFixed(4));
