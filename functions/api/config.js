import {json} from './_lib.js';
import {contactReady} from './contact.js';
export function onRequestGet({env}){return json({stripeAvailable:!!env.STRIPE_SECRET_KEY,requestsAvailable:!!env.REQUESTS,contactAvailable:contactReady(env)});}
