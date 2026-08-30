import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Body from './components/Body'
import ClientPage from './pages/ClientPage'
import ClientsPage from './pages/ClientsPage'
import CompanyPage from './pages/CompanyPage'
import CreateClientPage from './pages/CreateClientPage'
import CreateInvoicePage from './pages/CreateInvoicePage'
import CreateProductsPage from './pages/CreateProductsPage'
import EditCompanyPage from './pages/EditCompanyPage'
import EditInvoicePage from './pages/EditInvoicePage'
import EditProductPage from './pages/EditProductPage'
import InvoiceDetailsPage from './pages/InvoiceDetailsPage'
import InvoicesPage from './pages/InvoicesPage'
import LoginPage from './pages/LoginPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
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
          <Route path="/invoices/create" element={<CreateInvoicePage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
          <Route path="/invoices/:id/edit" element={<EditInvoicePage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/create" element={<CreateClientPage />} />
          <Route path="/clients/:id" element={<ClientPage />} />
          <Route path="/clients/:id/edit" element={<ClientPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/create" element={<CreateProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/products/:id/edit" element={<EditProductPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
