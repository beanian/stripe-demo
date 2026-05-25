export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
export const QUOTE_ID = 'QT-2024-001';

export const ROUTES = {
  HOME: '/',
  QUOTE: '/quote',
  CHECKOUT: '/pay/checkout',
  ELEMENTS: '/pay/elements',
  CUSTOM: '/pay/custom',
  COMPARE: '/pay/compare',
  CHECKOUT_CONFIRMATION: '/confirmation/checkout',
  ELEMENTS_CONFIRMATION: '/confirmation/elements',
  CUSTOM_CONFIRMATION: '/confirmation/custom',
  MYAXA_WALLET: '/myaxa/wallet',
} as const;
