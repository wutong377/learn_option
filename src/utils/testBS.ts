import { BlackScholes } from './blackScholes';

const params = {
    S: 100,
    K: 100,
    t: 1, // 1 year
    sigma: 0.2,
    r: 0.05,
    q: 0
};

const callGreeks = BlackScholes.calculate(params, 'call');
console.log('Call Greeks:', JSON.stringify(callGreeks, null, 2));

const putGreeks = BlackScholes.calculate(params, 'put');
console.log('Put Greeks:', JSON.stringify(putGreeks, null, 2));
