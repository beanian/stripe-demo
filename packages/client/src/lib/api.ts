import type { Quote, PaymentSchedule } from '../types/quote';
import type {
  CheckoutSessionResponse,
  PaymentIntentResponse,
  UpdatePaymentIntentResponse,
  SessionStatusResponse,
} from '../types/stripe';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export function fetchQuote(id: string): Promise<Quote> {
  return request<Quote>(`/quote/${id}`);
}

export function createCheckoutSession(
  quoteId: string,
  paymentSchedule: PaymentSchedule,
): Promise<CheckoutSessionResponse> {
  return request<CheckoutSessionResponse>('/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ quoteId, paymentSchedule }),
  });
}

export function createPaymentIntent(
  quoteId: string,
  paymentSchedule: PaymentSchedule,
): Promise<PaymentIntentResponse> {
  return request<PaymentIntentResponse>('/create-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ quoteId, paymentSchedule }),
  });
}

export function updatePaymentIntent(
  paymentIntentId: string,
  paymentSchedule: PaymentSchedule,
): Promise<UpdatePaymentIntentResponse> {
  return request<UpdatePaymentIntentResponse>('/update-payment-intent', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId, paymentSchedule }),
  });
}

export function createSepaIntent(quoteId: string): Promise<PaymentIntentResponse> {
  return request<PaymentIntentResponse>('/create-sepa-intent', {
    method: 'POST',
    body: JSON.stringify({ quoteId }),
  });
}

export function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  return request<SessionStatusResponse>(`/session-status?session_id=${encodeURIComponent(sessionId)}`);
}
