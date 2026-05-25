export interface IntegrationSpec {
  id: string;
  number: number;
  title: string;
  uiAnchor: string;
  blurb: string;
  direction: 'outbound' | 'inbound-webhook' | 'browser-direct';
  endpoint: { method: string; path: string };
  trigger: string;
  requestSample?: string;
  responseSample?: string;
  webhookEvents?: string[];
  muleSoftRole: string;
  axaSystems: string[];
  notes?: string;
}

export const INTEGRATION_SPECS: IntegrationSpec[] = [
  {
    id: 'sync-customer',
    number: 1,
    title: 'Sync policyholder to Stripe Customer',
    uiAnchor: 'Quote summary / customer card',
    blurb: 'Before saved cards are possible, each AXA policyholder must have a corresponding Stripe Customer record.',
    direction: 'outbound',
    endpoint: { method: 'POST', path: '/v1/customers' },
    trigger: 'On first quote-to-pay handoff for a new policyholder (idempotent on email).',
    requestSample: `{
  "name": "John Murphy",
  "email": "john.murphy@example.ie",
  "phone": "+353 87 123 4567",
  "address": {
    "line1": "42 Grafton Street",
    "city": "Dublin",
    "postal_code": "D02 Y728",
    "country": "IE"
  },
  "metadata": {
    "axa_policy_holder_id": "PH-00198432"
  }
}`,
    responseSample: `{
  "id": "cus_Ua45hy5HUFvTKo",
  "object": "customer",
  "created": 1761500200,
  "email": "john.murphy@example.ie",
  "metadata": { "axa_policy_holder_id": "PH-00198432" }
}`,
    muleSoftRole:
      'Receive policyholder upsert event from policy admin, call Stripe, persist returned cus_xxx ID back into the AXA customer record. All future calls reference this ID.',
    axaSystems: ['Policy Admin', 'CRM / Customer 360', 'API gateway'],
    notes:
      'MuleSoft should hold the only mapping between AXA customer ID and Stripe customer ID. Stripe should never see PII it does not need.',
  },
  {
    id: 'payment-intent',
    number: 2,
    title: 'Create PaymentIntent linked to the customer',
    uiAnchor: 'Schedule selector / amount due',
    blurb:
      'The PaymentIntent is what authorises the charge. To enable saved-card reuse, it must carry the customer ID and request future-usage permission.',
    direction: 'outbound',
    endpoint: { method: 'POST', path: '/v1/payment_intents' },
    trigger: 'When the quote page hands off to the payment step, and again on schedule change.',
    requestSample: `{
  "amount": 84750,
  "currency": "eur",
  "customer": "cus_Ua45hy5HUFvTKo",
  "payment_method_types": ["card", "link"],
  "setup_future_usage": "off_session",
  "metadata": {
    "quoteId": "QT-2024-001",
    "paymentSchedule": "annual"
  }
}`,
    responseSample: `{
  "id": "pi_3PqA8Z2eZvKYlo2C1B3X4Y5Z",
  "client_secret": "pi_3PqA…_secret_x6Y7",
  "status": "requires_payment_method",
  "amount": 84750
}`,
    muleSoftRole:
      'Receive premium + schedule from quote engine, validate, call Stripe with the resolved customer ID, return only the client_secret + amount to the browser. Never expose the secret key.',
    axaSystems: ['Quote engine', 'Pricing service', 'API gateway'],
    notes:
      'setup_future_usage=off_session is the flag that turns a one-shot payment into "and remember this card for later".',
  },
  {
    id: 'customer-session',
    number: 3,
    title: 'Open a short-lived CustomerSession',
    uiAnchor: 'Card payment form (the saved-card list)',
    blurb:
      'The CustomerSession is the credential that lets the browser see the customer\'s saved cards — without it, the PaymentElement renders only the blank "new card" form.',
    direction: 'outbound',
    endpoint: { method: 'POST', path: '/v1/customer_sessions' },
    trigger: 'Once per checkout page load, alongside the PaymentIntent.',
    requestSample: `{
  "customer": "cus_Ua45hy5HUFvTKo",
  "components": {
    "payment_element": {
      "enabled": true,
      "features": {
        "payment_method_redisplay": "enabled",
        "payment_method_save": "enabled",
        "payment_method_save_usage": "off_session",
        "payment_method_remove": "enabled"
      }
    }
  }
}`,
    responseSample: `{
  "client_secret": "_pss_…",
  "customer": "cus_Ua45hy5HUFvTKo",
  "expires_at": 1761503800
}`,
    muleSoftRole:
      'Issue this call on every checkout entry. The returned client_secret is short-lived (~30 min) and scoped to one customer — safe to send to the browser.',
    axaSystems: ['API gateway', 'Session service'],
    notes:
      'This replaces the older ephemeral-keys pattern. Required for Stripe.js to call /v1/customers/{id}/payment_methods on the user\'s behalf.',
  },
  {
    id: 'list-saved-pms',
    number: 4,
    title: 'Stripe.js fetches the saved cards',
    uiAnchor: 'Saved-card list inside the PaymentElement',
    blurb:
      'Stripe.js calls the Stripe API directly from the browser using the CustomerSession secret. MuleSoft is not in this path — but the policyholder\'s wallet view in AXA self-serve will need its own copy.',
    direction: 'browser-direct',
    endpoint: { method: 'GET', path: '/v1/customers/{id}/payment_methods' },
    trigger: 'Stripe.js, after the Elements provider mounts.',
    responseSample: `{
  "data": [
    { "id": "pm_1Nx…", "card": { "brand": "visa", "last4": "4242", "exp_month": 8, "exp_year": 2029 } },
    { "id": "pm_1Ny…", "card": { "brand": "mastercard", "last4": "4444", "exp_month": 12, "exp_year": 2028 } },
    { "id": "pm_1Nz…", "card": { "brand": "amex", "last4": "8431", "exp_month": 3, "exp_year": 2030 } }
  ]
}`,
    muleSoftRole:
      'In any AXA channel that embeds Stripe Elements (checkout AND My AXA "Manage saved cards"), this stays browser-direct — MuleSoft just mints the CustomerSession (#3) and stays out of the read path. MuleSoft only proxies this call server-side for channels that DO NOT load Stripe.js: server-rendered policy pages showing "Paid by Visa •4242" as read-only metadata, back-office / call-centre tools, batch reporting. No local wallet table is maintained in either case — Stripe is canonical.',
    axaSystems: ['Self-serve portal (Stripe.js path)', 'Mobile app (Stripe SDK path)', 'Server-rendered policy pages (MuleSoft proxy path)', 'Call-centre tooling (MuleSoft proxy path)'],
    notes:
      'Default to the browser-direct pattern — it scales better, avoids a MuleSoft hop, and lets Stripe Elements handle card brand icons / expiry warnings. Only fall back to a server-side proxy where Stripe.js cannot be loaded.',
  },
  {
    id: 'set-default-card',
    number: 5,
    title: 'Set a saved card as default → sync to BillingCenter',
    uiAnchor: 'My AXA self-serve "Manage saved cards" screen (not on this page)',
    blurb:
      'AXA only pushes a saved card into BillingCenter when the customer takes deliberate action: either they pay with it (covered by #6) or they pick it as their default in self-serve. Merely saving a card does NOT trigger a BC sync — payment_method.attached is intentionally not subscribed.',
    direction: 'outbound',
    endpoint: { method: 'POST', path: '/v1/customers/{id} (Stripe) + BC payment-instrument upsert' },
    trigger:
      'Customer clicks "Set as default" on a saved card in My AXA / mobile self-serve. Synchronous MuleSoft orchestration — no webhook in the loop.',
    requestSample: `// Step 1 — MuleSoft updates Stripe
POST /v1/customers/cus_Ua45hy5HUFvTKo
{
  "invoice_settings": {
    "default_payment_method": "pm_1NxYz…"
  }
}

// Step 2 — MuleSoft updates Guidewire BC
PATCH /billing/v1/accounts/{axa_account_id}/payment-instruments/default
{
  "stripePaymentMethodId": "pm_1NxYz…",
  "brand": "visa",
  "last4": "4242",
  "expMonth": 8,
  "expYear": 2029
}`,
    muleSoftRole:
      'Orchestrate the two writes as a single user action with rollback semantics — if the BC update fails, revert the Stripe default (or queue compensation). BC must always reflect the same default that Stripe holds, because BC is the system that initiates instalment charges.',
    axaSystems: ['My AXA self-serve', 'Guidewire BillingCenter'],
    notes:
      'We do NOT subscribe to payment_method.attached / .detached / .updated. The card auto-updater concern still applies, but it is handled inside #6: every successful instalment charge re-asserts the PM ID into BC, so a refreshed card flows through naturally on the next debit.',
  },
  {
    id: 'webhook-payment-success',
    number: 6,
    title: 'Webhook: payment succeeded',
    uiAnchor: 'Pay button / confirmation',
    blurb:
      'The browser is told the payment succeeded for UX, but policy issuance must hang off the webhook — the browser cannot be trusted as the source of truth.',
    direction: 'inbound-webhook',
    endpoint: { method: 'POST', path: '/webhooks/stripe (MuleSoft endpoint)' },
    trigger: 'Stripe → MuleSoft after the charge clears.',
    webhookEvents: ['payment_intent.succeeded', 'payment_intent.payment_failed', 'charge.refunded'],
    requestSample: `{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3PqA8Z…",
      "amount_received": 84750,
      "customer": "cus_Ua45hy5HUFvTKo",
      "payment_method": "pm_1NxYz…",
      "metadata": { "quoteId": "QT-2024-001" }
    }
  }
}`,
    muleSoftRole:
      'Verify signature, dedupe by event ID, then drive two downstream calls: (a) Guidewire PolicyCenter — bind / issue the policy referenced by metadata.quoteId, (b) Guidewire BillingCenter — record the payment received against the BC invoice AND upsert the PaymentMethod ID used (with brand / last4 / expiry) as a known payment instrument on the account. This is THE moment a card becomes known to BC — saving a card without paying does not. BC also owns instalment scheduling for PBI from this point on, and a successful instalment charge here re-asserts the PM details (catching Stripe card-auto-updater changes).',
    axaSystems: ['Guidewire PolicyCenter (PAS)', 'Guidewire BillingCenter'],
  },
];

export function findSpec(id: string): IntegrationSpec | undefined {
  return INTEGRATION_SPECS.find((s) => s.id === id);
}
