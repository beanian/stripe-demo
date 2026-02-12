import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Quote, PaymentSchedule, PathSelection } from '../types/quote';
import { fetchQuote } from '../lib/api';
import { QUOTE_ID } from '../lib/constants';

interface QuoteState {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  selectedPath: PathSelection;
  schedule: PaymentSchedule;
}

type QuoteAction =
  | { type: 'SET_QUOTE'; payload: Quote }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PATH'; payload: PathSelection }
  | { type: 'SET_SCHEDULE'; payload: PaymentSchedule };

interface QuoteContextValue extends QuoteState {
  setPath: (path: PathSelection) => void;
  setSchedule: (schedule: PaymentSchedule) => void;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

function quoteReducer(state: QuoteState, action: QuoteAction): QuoteState {
  switch (action.type) {
    case 'SET_QUOTE':
      return { ...state, quote: action.payload, loading: false, error: null };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PATH':
      return { ...state, selectedPath: action.payload };
    case 'SET_SCHEDULE':
      return { ...state, schedule: action.payload };
    default:
      return state;
  }
}

const initialState: QuoteState = {
  quote: null,
  loading: true,
  error: null,
  selectedPath: null,
  schedule: 'annual',
};

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quoteReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    fetchQuote(QUOTE_ID)
      .then((quote) => dispatch({ type: 'SET_QUOTE', payload: quote }))
      .catch((err) => dispatch({ type: 'SET_ERROR', payload: (err as Error).message }));
  }, []);

  const setPath = (path: PathSelection) => dispatch({ type: 'SET_PATH', payload: path });
  const setSchedule = (schedule: PaymentSchedule) => dispatch({ type: 'SET_SCHEDULE', payload: schedule });

  return (
    <QuoteContext.Provider value={{ ...state, setPath, setSchedule }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error('useQuote must be used within a QuoteProvider');
  return ctx;
}
