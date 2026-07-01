import type { Appearance } from '@stripe/stripe-js';

/**
 * Appearance tuned to reproduce the AXA mockup exactly, using ONLY the
 * Stripe Appearance API. Targets the accordion-with-radios layout:
 * clean white radio rows, AXA-blue selected radio, soft-grey inputs,
 * small grey labels — matching the mockup pixel-for-pixel in spirit.
 */
export const mockupAppearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#00008F',
    colorBackground: '#FFFFFF',
    colorText: '#1A1A2E',
    colorTextSecondary: '#6B7280',
    colorTextPlaceholder: '#9CA3AF',
    colorDanger: '#FF1721',
    colorIcon: '#6B7280',
    fontFamily:
      '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSizeBase: '15px',
    borderRadius: '10px',
    spacingUnit: '4px',
    spacingGridRow: '16px',
  },
  rules: {
    /* Tabs — the payment-method selector (Card + wallets) sits at the top of
       the Element, inside our blue-bordered container. Keep them clean and
       on-brand (AXA blue when selected). */
    '.Tab': {
      border: '1px solid #DCDCE4',
      backgroundColor: '#FFFFFF',
      boxShadow: 'none',
    },
    '.Tab:hover': {
      border: '1px solid #C7C7D4',
    },
    '.Tab--selected': {
      border: '1px solid #00008F',
      backgroundColor: 'rgba(0, 0, 143, 0.04)',
      boxShadow: '0 0 0 1px #00008F',
    },
    '.TabIcon--selected': {
      color: '#00008F',
    },
    '.TabLabel--selected': {
      color: '#00008F',
    },

    /* Inputs — soft grey, generous padding to match the mockup fields */
    '.Input': {
      backgroundColor: '#FFFFFF',
      border: '1px solid #DCDCE4',
      boxShadow: 'none',
      padding: '12px 14px',
      color: '#1A1A2E',
      fontSize: '15px',
    },
    '.Input::placeholder': {
      color: '#9CA3AF',
    },
    '.Input:focus': {
      border: '1px solid #00008F',
      boxShadow: '0 0 0 3px rgba(0, 0, 143, 0.10)',
    },
    '.Input--invalid': {
      border: '1px solid #FF1721',
      boxShadow: '0 0 0 2px rgba(255, 23, 33, 0.12)',
    },

    /* Labels — small, dark, medium weight as in the mockup */
    '.Label': {
      color: '#1A1A2E',
      fontWeight: '500',
      fontSize: '13px',
      marginBottom: '6px',
    },

    /* Save-for-future checkbox */
    '.CheckboxInput': {
      backgroundColor: '#FFFFFF',
      borderColor: '#C7C7D4',
      borderRadius: '4px',
    },
    '.CheckboxInput--checked': {
      backgroundColor: '#00008F',
      borderColor: '#00008F',
    },
    '.CheckboxLabel': {
      color: '#6B7280',
      fontSize: '13px',
    },

    /* Dropdown (Country) */
    '.Dropdown': {
      border: '1px solid #DCDCE4',
      borderRadius: '10px',
    },
    '.Dropdown:focus': {
      border: '1px solid #00008F',
      boxShadow: '0 0 0 3px rgba(0, 0, 143, 0.10)',
    },
  },
};
