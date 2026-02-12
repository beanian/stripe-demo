import { Router, Request, Response } from 'express';
import stripe from '../services/stripe.js';
import { getQuote } from '../services/quote.js';
import { CreatePaymentIntentRequest, UpdatePaymentIntentRequest } from '../types.js';

const router = Router();

router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { quoteId, paymentSchedule } = req.body as CreatePaymentIntentRequest;
    const quote = getQuote(quoteId);

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
      payment_method_types: ['card', 'link'],
      metadata,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: premium,
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

    res.json({
      clientSecret: updated.client_secret,
      amount: updated.amount / 100,
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
