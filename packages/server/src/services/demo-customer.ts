import stripe from './stripe.js';
import { getQuote } from './quote.js';

const SEED_FLAG = 'axa-stripe-demo-v1';

const SEED_PAYMENT_METHODS = [
  'pm_card_visa',
  'pm_card_mastercard',
  'pm_card_amex',
] as const;

let cachedCustomerId: string | null = null;
let initPromise: Promise<string> | null = null;

async function findExistingDemoCustomer(): Promise<string | null> {
  const search = await stripe.customers.search({
    query: `metadata['demo_seed']:'${SEED_FLAG}'`,
    limit: 1,
  });
  return search.data[0]?.id ?? null;
}

async function attachSeedCards(customerId: string): Promise<void> {
  const existing = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 20,
  });

  if (existing.data.length < SEED_PAYMENT_METHODS.length) {
    for (const token of SEED_PAYMENT_METHODS) {
      await stripe.paymentMethods.attach(token, { customer: customerId });
    }
  }

  const refreshed = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
    limit: 20,
  });

  // PaymentElement only redisplays saved cards with allow_redisplay='always'.
  // PMs attached server-side default to 'unspecified', so promote them.
  for (const pm of refreshed.data) {
    if (pm.allow_redisplay !== 'always') {
      await stripe.paymentMethods.update(pm.id, { allow_redisplay: 'always' });
    }
  }

  if (refreshed.data[0]) {
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: refreshed.data[0].id },
    });
  }
}

async function createDemoCustomer(): Promise<string> {
  const quote = getQuote('QT-2024-001');
  const customer = await stripe.customers.create({
    name: quote.customerName,
    email: quote.customerEmail,
    phone: quote.customerPhone,
    address: {
      line1: quote.addressLine1,
      city: quote.addressCity,
      postal_code: quote.addressPostcode,
      country: quote.addressCountry,
    },
    metadata: { demo_seed: SEED_FLAG },
  });
  return customer.id;
}

export async function getDemoCustomerId(): Promise<string> {
  if (cachedCustomerId) return cachedCustomerId;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let id = await findExistingDemoCustomer();
    if (!id) id = await createDemoCustomer();
    await attachSeedCards(id);
    cachedCustomerId = id;
    return id;
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}
