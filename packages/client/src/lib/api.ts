import type { Quote, PaymentSchedule } from '../types/quote';
import type {
  CheckoutSessionResponse,
  ElementsSessionResponse,
  SepaSessionResponse,
  SessionStatusResponse,
  WalletResponse,
  WalletSetupCheckoutSessionResponse,
  ShowcaseSessionResponse,
} from '../types/stripe';

export type ElementsFlow = 'elements' | 'custom';

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

export function createElementsSession(
  quoteId: string,
  paymentSchedule: PaymentSchedule,
  flow: ElementsFlow = 'elements',
): Promise<ElementsSessionResponse> {
  return request<ElementsSessionResponse>('/create-elements-session', {
    method: 'POST',
    body: JSON.stringify({ quoteId, paymentSchedule, flow }),
  });
}

export function updateElementsSession(
  sessionId: string,
  paymentSchedule: PaymentSchedule,
  flow: ElementsFlow = 'elements',
): Promise<ElementsSessionResponse> {
  return request<ElementsSessionResponse>('/update-elements-session', {
    method: 'POST',
    body: JSON.stringify({ sessionId, paymentSchedule, flow }),
  });
}

export function createSepaSession(quoteId: string): Promise<SepaSessionResponse> {
  return request<SepaSessionResponse>('/create-sepa-session', {
    method: 'POST',
    body: JSON.stringify({ quoteId }),
  });
}

export function getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
  return request<SessionStatusResponse>(`/session-status?session_id=${encodeURIComponent(sessionId)}`);
}

export function listWallet(): Promise<WalletResponse> {
  return request<WalletResponse>('/wallet/payment-methods');
}

export function createWalletSetupCheckoutSession(): Promise<WalletSetupCheckoutSessionResponse> {
  return request<WalletSetupCheckoutSessionResponse>('/wallet/create-setup-checkout-session', {
    method: 'POST',
  });
}

export function setDefaultCard(paymentMethodId: string): Promise<{ ok: boolean; defaultPaymentMethodId: string }> {
  return request('/wallet/set-default', {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId }),
  });
}

export function detachCard(paymentMethodId: string): Promise<{ ok: boolean; detached: string }> {
  return request('/wallet/detach', {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId }),
  });
}

export function createShowcaseSession(): Promise<ShowcaseSessionResponse> {
  return request<ShowcaseSessionResponse>('/create-showcase-session', { method: 'POST' });
}
