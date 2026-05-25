import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';
import { getQuote } from '../services/quote.js';
import { getDemoCustomerId } from '../services/demo-customer.js';
import { CreatePaymentIntentRequest, UpdatePaymentIntentRequest } from '../types.js';

const router = Router();

async function createCustomerSession(customerId: string): Promise<string> {
  const session = await stripe.customerSessions.create({
    customer: customerId,
    components: {
      payment_element: {
        enabled: true,
        features: {
          payment_method_redisplay: 'enabled',
          payment_method_save: 'enabled',
          payment_method_save_usage: 'off_session',
          payment_method_remove: 'enabled',
        },
      },
    },
  });
  return session.client_secret;
}

router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { quoteId, paymentSchedule } = req.body as CreatePaymentIntentRequest;
    const quote = getQuote(quoteId);
    const customerId = await getDemoCustomerId();

    const premium = paymentSchedule === 'deposit' ? quote.depositAmount : quote.annualPremium;
    const amountInCents = Math.round(premium * 100);

    const metadata: Record<string, string> = { quoteId, paymentSchedule };
    if (paymentSchedule === 'deposit') {
      metadata.depositAmount = String(quote.depositAmount);
      metadata.remainingBalance = String(quote.remainingBalance);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      customer: customerId,
      payment_method_types: ['card', 'link'],
      setup_future_usage: 'off_session',
      metadata,
    });

    const customerSessionClientSecret = await createCustomerSession(customerId);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: premium,
      customerId,
      customerSessionClientSecret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

router.post('/update-payment-intent', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, paymentSchedule } = req.body as UpdatePaymentIntentRequest;
    const quote = getQuote('QT-2024-001');
    const customerId = await getDemoCustomerId();

    const premium = paymentSchedule === 'deposit' ? quote.depositAmount : quote.annualPremium;
    const amountInCents = Math.round(premium * 100);

    const metadata: Record<string, string> = { paymentSchedule };
    if (paymentSchedule === 'deposit') {
      metadata.depositAmount = String(quote.depositAmount);
      metadata.remainingBalance = String(quote.remainingBalance);
    }

    const updated = await stripe.paymentIntents.update(paymentIntentId, {
      amount: amountInCents,
      metadata,
    });

    const customerSessionClientSecret = await createCustomerSession(customerId);

    res.json({
      clientSecret: updated.client_secret,
      amount: updated.amount / 100,
      customerId,
      customerSessionClientSecret,
    });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    res.status(500).json({ error: 'Failed to update payment intent' });
  }
});

router.post('/create-sepa-intent', async (req: Request, res: Response) => {
  try {
    const { quoteId } = req.body as { quoteId: string };
    const quote = getQuote(quoteId);

    const amountInCents = Math.round(quote.remainingBalance * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      payment_method_types: ['sepa_debit'],
      metadata: {
        quoteId,
        paymentSchedule: 'deposit',
        type: 'sepa_remaining_balance',
        remainingBalance: String(quote.remainingBalance),
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating SEPA intent:', error);
    res.status(500).json({ error: 'Failed to create SEPA intent' });
  }
});

export default router;
