import type { Appearance } from '@stripe/stripe-js';

export const axaAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#00008F',
    colorBackground: '#FFFFFF',
    colorText: '#1A1A3E',
    colorDanger: '#FF1721',
    fontFamily:
      '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #CCCCCC',
      boxShadow: 'none',
      padding: '10px 12px',
    },
    '.Input:focus': {
      border: '1px solid #00008F',
      boxShadow: '0 0 0 1px #00008F',
    },
    '.Label': {
      color: '#4A4A4A',
      fontWeight: '500',
      marginBottom: '6px',
    },
    '.Tab': {
      border: '1px solid #CCCCCC',
    },
    '.Tab--selected': {
      border: '1px solid #00008F',
      backgroundColor: '#F5F5F5',
    },
  },
};
