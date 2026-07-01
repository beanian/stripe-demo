import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';
import { getDemoCustomerId } from '../services/demo-customer.js';

const router = Router();

// A mid-term-adjustment ("change") amount — the mockup reads
// "How would you like to pay for this change?"
const SHOWCASE_AMOUNT_EUR = 42.3;

/**
 * Backs the "mockup parity" showcase. Produces exactly what the Payment
 * Element needs to render the AXA mockup:
 *  - a customer (required for the "save card" checkbox)
 *  - NO setup_future_usage on the intent, so saving is the user's choice
 *    (setting it would force-save and hide the checkbox)
 *  - a CustomerSession with payment_method_save enabled (renders the checkbox)
 *    and payment_method_redisplay disabled (no saved-card list — the mockup
 *    shows a clean new-card form)
 */
router.post('/create-showcase-intent', async (_req: Request, res: Response) => {
  try {
    const customerId = await getDemoCustomerId();
    const amountInCents = Math.round(SHOWCASE_AMOUNT_EUR * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: customerId,
      // Card powers Apple Pay / Google Pay wallets in the Payment Element.
      payment_method_types: ['card'],
      metadata: { type: 'mockup_showcase', reason: 'mid_term_adjustment' },
    });

    const customerSession = await stripe.customerSessions.create({
      customer: customerId,
      components: {
        payment_element: {
          enabled: true,
          features: {
            payment_method_save: 'enabled',
            payment_method_save_usage: 'off_session',
            // No saved-card list on this screen — mockup is a clean new-card form.
            payment_method_redisplay: 'disabled',
            payment_method_remove: 'disabled',
          },
        },
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      customerSessionClientSecret: customerSession.client_secret,
      amount: SHOWCASE_AMOUNT_EUR,
    });
  } catch (error) {
    console.error('Error creating showcase intent:', error);
    res.status(500).json({ error: 'Failed to create showcase intent' });
  }
});

export default router;
