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

router.post('/wallet/create-setup-intent', async (_req: Request, res: Response) => {
  try {
    const customerId = await getDemoCustomerId();

    // No CustomerSession on this flow on purpose:
    // "Add a new card" must collect new card details only — it must NOT offer
    // the user their already-saved cards (the whole UI above is for that).
    // The SetupIntent is bound to the customer server-side, so the new
    // PaymentMethod is attached automatically on confirmSetup.
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
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
