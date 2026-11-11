import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#101527',
                color: '#f1f5f9',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '12px',
                fontFamily: '"Space Grotesk", sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22d3ee', secondary: '#05070f' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#05070f' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
