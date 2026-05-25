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
