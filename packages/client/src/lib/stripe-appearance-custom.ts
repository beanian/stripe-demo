import type { Appearance } from '@stripe/stripe-js';

export const customAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#00008F',
    colorBackground: '#FFFFFF',
    colorText: '#1A1A2E',
    colorDanger: '#FF1721',
    fontFamily:
      '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: '12px',
    spacingUnit: '5px',
    colorTextSecondary: '#6B7280',
    colorTextPlaceholder: '#9CA3AF',
    colorIcon: '#6B7280',
    colorIconHover: '#1A1A2E',
  },
  rules: {
    '.Input': {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      padding: '14px 16px',
      color: '#1A1A2E',
      fontSize: '15px',
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
    },
    '.Input:focus': {
      border: '1px solid #00008F',
      boxShadow: '0 0 0 3px rgba(0, 0, 143, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.05)',
      backgroundColor: '#F5F5FF',
    },
    '.Input:hover': {
      border: '1px solid #D1D5DB',
      backgroundColor: '#FAFAFA',
    },
    '.Input--invalid': {
      border: '1px solid #FF1721',
      boxShadow: '0 0 0 2px rgba(255, 23, 33, 0.15)',
    },
    '.Label': {
      color: '#6B7280',
      fontWeight: '600',
      fontSize: '11px',
      marginBottom: '10px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
    },
    '.Tab': {
      border: '1px solid #E5E7EB',
      backgroundColor: '#FFFFFF',
      color: '#6B7280',
      boxShadow: 'none',
      transition: 'all 0.3s ease',
    },
    '.Tab:hover': {
      border: '1px solid #D1D5DB',
      backgroundColor: '#F9FAFB',
      color: '#1A1A2E',
    },
    '.Tab--selected': {
      border: '1px solid rgba(0, 0, 143, 0.4)',
      backgroundColor: 'rgba(0, 0, 143, 0.04)',
      color: '#00008F',
      boxShadow: '0 0 0 1px rgba(0, 0, 143, 0.2)',
    },
    '.TabIcon--selected': {
      color: '#00008F',
    },
    '.Block': {
      backgroundColor: '#F9FAFB',
      border: '1px solid #E5E7EB',
    },
    '.CheckboxInput': {
      backgroundColor: '#FFFFFF',
      borderColor: '#D1D5DB',
    },
    '.CheckboxInput--checked': {
      backgroundColor: '#00008F',
      borderColor: '#00008F',
    },
  },
};
