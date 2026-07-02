export interface Quote {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressCity: string;
  addressPostcode: string;
  addressCountry: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  coverType: 'comprehensive' | 'third-party' | 'third-party-fire-theft';
  annualPremium: number;
  startDate: string;
  endDate: string;
  depositPercentage: number;
  depositAmount: number;
  remainingBalance: number;
}

export type PaymentSchedule = 'annual' | 'deposit';

export interface CreateCheckoutSessionRequest {
  quoteId: string;
  paymentSchedule: PaymentSchedule;
}

export type ElementsFlow = 'elements' | 'custom';

export interface CreateElementsSessionRequest {
  quoteId: string;
  paymentSchedule: PaymentSchedule;
  flow?: ElementsFlow;
}

export interface UpdateElementsSessionRequest {
  sessionId: string;
  paymentSchedule: PaymentSchedule;
  flow?: ElementsFlow;
}
