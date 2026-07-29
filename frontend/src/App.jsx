import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ErpLayout from './components/erp/Layout';
import DashboardPage from './pages/erp/DashboardPage';
import BookingsPage from './pages/erp/BookingsPage';
import BookingFormPage from './pages/erp/BookingFormPage';
import BookingDetailPage from './pages/erp/BookingDetailPage';
import PropertiesPage from './pages/erp/PropertiesPage';
import ProjectFormPage from './pages/erp/ProjectFormPage';
import PlotFormPage from './pages/erp/PlotFormPage';
import PaymentsPage from './pages/erp/PaymentsPage';
import PaymentFormPage from './pages/erp/PaymentFormPage';
import PaymentDetailPage from './pages/erp/PaymentDetailPage';
import UsersPage from './pages/erp/UsersPage';
import UserFormPage from './pages/erp/UserFormPage';
import AuditLogsPage from './pages/erp/AuditLogsPage';
import LoginPage from './pages/erp/LoginPage';

function CorporateLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main>
        <Routes>
          <Route index element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CorporateLayout />} />
        <Route path="/erp/login" element={<LoginPage />} />
        <Route path="/erp" element={<ErpLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/new" element={<BookingFormPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="bookings/:id/edit" element={<BookingFormPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/projects/new" element={<ProjectFormPage />} />
          <Route path="properties/projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="properties/plots/new" element={<PlotFormPage />} />
          <Route path="properties/plots/:id/edit" element={<PlotFormPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="payments/new" element={<PaymentFormPage />} />
          <Route path="payments/:id" element={<PaymentDetailPage />} />
          <Route path="payments/:id/edit" element={<PaymentFormPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:id/edit" element={<UserFormPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
