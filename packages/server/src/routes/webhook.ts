import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';

const router = Router();

router.post('/webhook', (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${message}`);
    res.status(400).send(`Webhook Error: ${message}`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Checkout session completed:', event.data.object.id);
      break;
    case 'payment_intent.succeeded':
      console.log('Payment intent succeeded:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('Payment intent failed:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
