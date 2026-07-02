import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';
import { getDemoCustomerId } from '../services/demo-customer.js';

const router = Router();

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

router.get('/wallet/payment-methods', async (_req: Request, res: Response) => {
  try {
    const customerId = await getDemoCustomerId();

    const [pms, customer] = await Promise.all([
      stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 20 }),
      stripe.customers.retrieve(customerId),
    ]);

    if (customer.deleted) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const defaultPmId = customer.invoice_settings?.default_payment_method as string | null;

    const cards: SavedCard[] = pms.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? 'unknown',
      last4: pm.card?.last4 ?? '••••',
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
      isDefault: pm.id === defaultPmId,
    }));

    // Stable sort: default first, then by brand+last4
    cards.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.brand.localeCompare(b.brand) || a.last4.localeCompare(b.last4);
    });

    res.json({ customerId, cards });
  } catch (error) {
    console.error('Error listing wallet:', error);
    res.status(500).json({ error: 'Failed to list payment methods' });
  }
});

router.post('/wallet/create-setup-checkout-session', async (_req: Request, res: Response) => {
  try {
    const customerId = await getDemoCustomerId();

    // Stripe-recommended pattern for saving a new card: a Checkout Session
    // in `mode: 'setup'`. Stripe owns the entire add-card surface (form, PCI
    // scope, 3DS, brand validation, a11y, localisation) — we never touch
    // a raw SetupIntent client_secret. The Session is bound to the customer
    // server-side, so the new PaymentMethod is attached automatically once
    // setup succeeds.
    //
    // "Add a new card" must collect new card details only — it must NOT
    // surface the user's already-saved cards (the wallet list above is the
    // surface for picking existing ones). Checkout in setup mode does not
    // re-render saved cards, so this is the default behaviour.
    //
    // ui_mode=embedded_page + redirect_on_completion=never keeps the entire flow
    // on the wallet page — the client receives an onComplete callback
    // instead of a top-level redirect.
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      ui_mode: 'embedded_page',
      customer: customerId,
      payment_method_types: ['card'],
      currency: 'eur',
      redirect_on_completion: 'never',
    });

    res.json({
      clientSecret: session.client_secret,
      customerId,
    });
  } catch (error) {
    console.error('Error creating setup checkout session:', error);
    res.status(500).json({ error: 'Failed to create setup checkout session' });
  }
});

router.post('/wallet/set-default', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.body as { paymentMethodId?: string };
    if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId required' });

    const customerId = await getDemoCustomerId();

    // Belt-and-braces: ensure the PM belongs to this customer before defaulting it.
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== customerId) {
      return res.status(403).json({ error: 'Payment method does not belong to this customer' });
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // In production this is where MuleSoft would also PATCH Guidewire BillingCenter
    // with the new default payment instrument. Demo stops at Stripe.

    res.json({ ok: true, defaultPaymentMethodId: paymentMethodId });
  } catch (error) {
    console.error('Error setting default:', error);
    res.status(500).json({ error: 'Failed to set default payment method' });
  }
});

router.post('/wallet/detach', async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.body as { paymentMethodId?: string };
    if (!paymentMethodId) return res.status(400).json({ error: 'paymentMethodId required' });

    const customerId = await getDemoCustomerId();
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== customerId) {
      return res.status(403).json({ error: 'Payment method does not belong to this customer' });
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ ok: true, detached: paymentMethodId });
  } catch (error) {
    console.error('Error detaching payment method:', error);
    res.status(500).json({ error: 'Failed to detach payment method' });
  }
});

export default router;
