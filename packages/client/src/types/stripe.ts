export interface CheckoutSessionResponse {
  clientSecret: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  customerId?: string;
  customerSessionClientSecret?: string;
}

export interface UpdatePaymentIntentResponse {
  clientSecret: string;
  amount: number;
  customerId?: string;
  customerSessionClientSecret?: string;
}

export interface SessionStatusResponse {
  status: string;
  payment_status: string;
  customer_email: string | null;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface WalletResponse {
  customerId: string;
  cards: SavedCard[];
}

export interface WalletSetupIntentResponse {
  clientSecret: string;
  customerId: string;
}
