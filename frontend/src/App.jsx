import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ErpLayout from './components/erp/Layout';
import LoginPage from './pages/erp/LoginPage';
import DashboardPage from './pages/erp/DashboardPage';
import CustomersPage from './pages/erp/CustomersPage';
import CustomerFormPage from './pages/erp/CustomerFormPage';
import CustomerDetailPage from './pages/erp/CustomerDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-bg">
              <Navbar />
              <main>
                <HomePage />
              </main>
              <Footer />
            </div>
          }
        />
        <Route path="/erp" element={<ErpLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="customers/:id/edit" element={<CustomerFormPage />} />
          <Route path="projects" element={<div className="text-text-muted text-center py-20">Projects page coming soon</div>} />
          <Route path="finance" element={<div className="text-text-muted text-center py-20">Finance page coming soon</div>} />
          <Route path="inventory" element={<div className="text-text-muted text-center py-20">Inventory page coming soon</div>} />
          <Route path="reports" element={<div className="text-text-muted text-center py-20">Reports page coming soon</div>} />
          <Route path="settings" element={<div className="text-text-muted text-center py-20">Settings page coming soon</div>} />
        </Route>
        <Route path="/erp/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
