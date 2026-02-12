import { Quote } from '../types.js';

const hardcodedQuote: Quote = {
  id: 'QT-2024-001',
  customerName: 'John Murphy',
  customerEmail: 'john.murphy@example.ie',
  customerPhone: '+353 87 123 4567',
  addressLine1: '42 Grafton Street',
  addressCity: 'Dublin',
  addressPostcode: 'D02 Y728',
  addressCountry: 'IE',
  vehicleReg: '212-D-12345',
  vehicleMake: 'Toyota',
  vehicleModel: 'Corolla',
  vehicleYear: 2021,
  coverType: 'comprehensive',
  annualPremium: 847.50,
  startDate: '2025-01-15',
  endDate: '2026-01-14',
  depositPercentage: 20,
  depositAmount: 169.50,
  remainingBalance: 678.00,
};

export function getQuote(_id: string): Quote {
  return hardcodedQuote;
}
