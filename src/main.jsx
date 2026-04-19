import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthProvider from './Components/Authentication/AuthProvider.jsx';
import AppRoutes from './Components/Routes/AppRoutes.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRoutes />

    </AuthProvider>
  </StrictMode>,
)