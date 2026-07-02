import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';
import { getDemoCustomerId } from '../services/demo-customer.js';

const router = Router();

// A mid-term-adjustment ("change") amount — the mockup reads
// "How would you like to pay for this change?"
const SHOWCASE_AMOUNT_EUR = 42.3;

/**
 * Backs the "mockup parity" showcase, now on the Checkout Sessions API
 * (ui_mode: 'elements'). Produces exactly what the Payment Element needs
 * to render the AXA mockup:
 *  - a customer (required for the "save card" checkbox)
 *  - NO setup_future_usage, so saving is the user's choice
 *    (setting it would force-save and hide the checkbox)
 *  - saved_payment_method_options.payment_method_save: 'enabled' renders
 *    the checkbox (replaces the CustomerSession payment_method_save feature)
 *  - the saved-card list is suppressed CLIENT-side via
 *    elementsOptions.savedPaymentMethod.enableRedisplay: 'never' — the
 *    mockup stays a clean new-card form
 */
router.post('/create-showcase-session', async (req: Request, res: Response) => {
  try {
    const customerId = await getDemoCustomerId();
    const amountInCents = Math.round(SHOWCASE_AMOUNT_EUR * 100);
    const returnUrlBase = process.env.CLIENT_URL || (req.headers.origin as string);

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'elements',
      mode: 'payment',
      customer: customerId,
      // Card powers Apple Pay / Google Pay wallets in the Payment Element.
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Policy change - mid-term adjustment' },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: { type: 'mockup_showcase', reason: 'mid_term_adjustment' },
      },
      saved_payment_method_options: {
        payment_method_save: 'enabled',
      },
      // The showcase confirms in place (redirect: 'if_required'); fallback only.
      return_url: `${returnUrlBase}/pay/showcase?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.json({
      clientSecret: session.client_secret,
      amount: SHOWCASE_AMOUNT_EUR,
    });
  } catch (error) {
    console.error('Error creating showcase session:', error);
    res.status(500).json({ error: 'Failed to create showcase session' });
  }
});

export default router;
