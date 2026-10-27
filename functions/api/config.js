import {json} from './_lib.js';
export function onRequestGet({env}){return json({stripeAvailable:!!env.STRIPE_SECRET_KEY,requestsAvailable:!!env.REQUESTS});}
