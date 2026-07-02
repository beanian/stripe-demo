export interface CheckoutSessionResponse {
  clientSecret: string;
}

export interface ElementsSessionResponse {
  clientSecret: string;
  sessionId: string;
  amount: number;
  customerId?: string;
}

export interface SepaSessionResponse {
  clientSecret: string;
  sessionId: string;
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

export interface WalletSetupCheckoutSessionResponse {
  clientSecret: string;
  customerId: string;
}

export interface ShowcaseSessionResponse {
  clientSecret: string;
  amount: number;
}
