import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../services/stripe.js';
import { getQuote } from '../services/quote.js';
import { getDemoCustomerId } from '../services/demo-customer.js';
import {
  CreateElementsSessionRequest,
  UpdateElementsSessionRequest,
  ElementsFlow,
  PaymentSchedule,
} from '../types.js';

const router = Router();

/**
 * Elements flows now run on the Checkout Sessions API (Stripe's recommended
 * integration path) with ui_mode: 'elements' — the browser renders the
 * Payment Element via a Checkout Session client_secret instead of a raw
 * PaymentIntent. The session natively handles what previously needed a
 * separate CustomerSession:
 *  - saved-card list + save checkbox: customer + saved_payment_method_options
 *  - saving for instalments (deposit flow only): payment_intent_data.
 *    setup_future_usage = 'off_session' force-saves the card — required
 *    because BillingCenter charges instalments off-session — and hides the
 *    save checkbox for that flow
 */

const CONFIRMATION_PATH: Record<ElementsFlow, string> = {
  elements: '/confirmation/elements',
  custom: '/confirmation/custom',
};

function returnUrlBase(req: Request): string {
  return process.env.CLIENT_URL || (req.headers.origin as string);
}

function buildCardSessionParams(
  req: Request,
  quoteId: string,
  paymentSchedule: PaymentSchedule,
  flow: ElementsFlow,
  customerId: string,
): Stripe.Checkout.SessionCreateParams {
  const quote = getQuote(quoteId);
  const premium = paymentSchedule === 'deposit' ? quote.depositAmount : quote.annualPremium;
  const amountInCents = Math.round(premium * 100);

  const metadata: Record<string, string> = { quoteId, paymentSchedule };
  if (paymentSchedule === 'deposit') {
    metadata.depositAmount = String(quote.depositAmount);
    metadata.remainingBalance = String(quote.remainingBalance);
  }

  return {
    ui_mode: 'elements',
    mode: 'payment',
    customer: customerId,
    // Card only — 'link' would render Link's own "save my info" signup box
    // (email/phone/name) inside the Payment Element, which AXA doesn't want.
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Motor Insurance - ${quote.coverType}`,
            description:
              paymentSchedule === 'deposit'
                ? `${quote.vehicleMake} ${quote.vehicleModel} - Deposit`
                : `${quote.vehicleMake} ${quote.vehicleModel} - Full Premium`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      // Deposit (PBI) flow: the card MUST be saved — BillingCenter charges
      // the 11 instalments off-session. This hides the save checkbox and
      // discloses the future-usage mandate instead.
      // Pay-in-full: no forced save — the checkbox below lets the customer
      // opt in.
      ...(paymentSchedule === 'deposit' ? { setup_future_usage: 'off_session' as const } : {}),
      metadata,
    },
    // Saved-card support on the session (replaces the CustomerSession):
    //  - payment_method_save enables the saved-PM feature — the saved-card
    //    list AND the "save for future use" checkbox (when not force-saving)
    //  - allow_redisplay_filters controls which saved cards are listed
    saved_payment_method_options: {
      payment_method_save: 'enabled',
      allow_redisplay_filters: ['always'],
    },
    return_url: `${returnUrlBase(req)}${CONFIRMATION_PATH[flow]}?session_id={CHECKOUT_SESSION_ID}`,
  };
}

router.post('/create-elements-session', async (req: Request, res: Response) => {
  try {
    const { quoteId, paymentSchedule, flow = 'elements' } = req.body as CreateElementsSessionRequest;
    const customerId = await getDemoCustomerId();

    const session = await stripe.checkout.sessions.create(
      buildCardSessionParams(req, quoteId, paymentSchedule, flow, customerId),
    );

    const quote = getQuote(quoteId);
    res.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      amount: paymentSchedule === 'deposit' ? quote.depositAmount : quote.annualPremium,
      customerId,
    });
  } catch (error) {
    console.error('Error creating elements session:', error);
    res.status(500).json({ error: 'Failed to create elements session' });
  }
});

// Schedule changes re-mint the session: the old one is expired and a fresh
// session is created with the new amount. (A Checkout Session's line items
// belong to the session, so a clean re-mint keeps the demo deterministic.)
router.post('/update-elements-session', async (req: Request, res: Response) => {
  try {
    const { sessionId, paymentSchedule, flow = 'elements' } = req.body as UpdateElementsSessionRequest;
    const quote = getQuote('QT-2024-001');
    const customerId = await getDemoCustomerId();

    // Best-effort: expire the superseded session so it can't be confirmed.
    try {
      await stripe.checkout.sessions.expire(sessionId);
    } catch {
      // Already expired/completed — nothing to do.
    }

    const session = await stripe.checkout.sessions.create(
      buildCardSessionParams(req, quote.id, paymentSchedule, flow, customerId),
    );

    res.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      amount: paymentSchedule === 'deposit' ? quote.depositAmount : quote.annualPremium,
      customerId,
    });
  } catch (error) {
    console.error('Error updating elements session:', error);
    res.status(500).json({ error: 'Failed to update elements session' });
  }
});

router.post('/create-sepa-session', async (req: Request, res: Response) => {
  try {
    const { quoteId } = req.body as { quoteId: string };
    const quote = getQuote(quoteId);
    const customerId = await getDemoCustomerId();

    const amountInCents = Math.round(quote.remainingBalance * 100);

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'elements',
      mode: 'payment',
      // Customer on the session prefills contact details and ties the SEPA
      // mandate to the policyholder for the instalment schedule.
      customer: customerId,
      payment_method_types: ['sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Motor Insurance - ${quote.coverType}`,
              description: `${quote.vehicleMake} ${quote.vehicleModel} - Remaining balance by Direct Debit`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          quoteId,
          paymentSchedule: 'deposit',
          type: 'sepa_remaining_balance',
          remainingBalance: String(quote.remainingBalance),
        },
      },
      // SEPA confirms in place (redirect: 'if_required'); this is a fallback.
      return_url: `${returnUrlBase(req)}${CONFIRMATION_PATH.elements}?session_id={CHECKOUT_SESSION_ID}`,
    });

    res.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating SEPA session:', error);
    res.status(500).json({ error: 'Failed to create SEPA session' });
  }
});

export default router;
