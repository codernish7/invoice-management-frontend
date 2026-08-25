import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Body from './components/Body'
import ClientDetailsPage from './pages/ClientDetailsPage'
import ClientsPage from './pages/ClientsPage'
import CompanyPage from './pages/CompanyPage'
import CreateClientPage from './pages/CreateClientPage'
import CreateProductsPage from './pages/CreateProductsPage'
import EditClientPage from './pages/EditClientPage'
import EditCompanyPage from './pages/EditCompanyPage'
import InvoiceDetailsPage from './pages/InvoiceDetailsPage'
import InvoicesPage from './pages/InvoicesPage'
import LoginPage from './pages/LoginPage'
import ProductsPage from './pages/ProductsPage'
import SignupPage from './pages/SignupPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Body />}>
          <Route path="/" element={<CompanyPage />} />
          <Route path="/edit" element={<EditCompanyPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/signup" element={<SignupPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/create" element={<CreateClientPage />} />
          <Route path="/clients/:id" element={<ClientDetailsPage />} />
          <Route path="/clients/:id/edit" element={<EditClientPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/create" element={<CreateProductsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
