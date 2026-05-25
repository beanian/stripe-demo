import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/shared/AppLayout';
import LandingPage from './pages/LandingPage';
import QuotePage from './pages/QuotePage';
import CheckoutPage from './pages/CheckoutPage';
import ElementsPage from './pages/ElementsPage';
import CustomPage from './pages/CustomPage';
import ComparePage from './pages/ComparePage';
import CheckoutConfirmation from './pages/CheckoutConfirmation';
import ElementsConfirmation from './pages/ElementsConfirmation';
import CustomConfirmation from './pages/CustomConfirmation';
import MyAxaWallet from './pages/MyAxaWallet';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/pay/checkout" element={<CheckoutPage />} />
        <Route path="/pay/elements" element={<ElementsPage />} />
        <Route path="/pay/custom" element={<CustomPage />} />
        <Route path="/pay/compare" element={<ComparePage />} />
        <Route path="/confirmation/checkout" element={<CheckoutConfirmation />} />
        <Route path="/confirmation/elements" element={<ElementsConfirmation />} />
        <Route path="/confirmation/custom" element={<CustomConfirmation />} />
        <Route path="/myaxa/wallet" element={<MyAxaWallet />} />
      </Route>
    </Routes>
  );
}
