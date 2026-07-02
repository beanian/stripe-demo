import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';
import { getQuote } from '../services/quote.js';
import { CreateCheckoutSessionRequest } from '../types.js';

const router = Router();

router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { quoteId, paymentSchedule } = req.body as CreateCheckoutSessionRequest;
    const quote = getQuote(quoteId);

    const premium = quote.annualPremium;
    const amountInCents = Math.round(premium * 100);

    const description = `${quote.vehicleMake} ${quote.vehicleModel} - Full Premium`;

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer_email: quote.customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Motor Insurance - ${quote.coverType}`,
              description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      return_url: `${process.env.CLIENT_URL || req.headers.origin}/confirmation/checkout?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.get('/session-status', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.session_id as string;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
    });
  } catch (error) {
    console.error('Error retrieving session status:', error);
    res.status(500).json({ error: 'Failed to retrieve session status' });
  }
});

export default router;
