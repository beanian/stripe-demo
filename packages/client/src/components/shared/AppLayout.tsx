import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-axa-grey-100">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
}
