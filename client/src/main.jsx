import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('DevSync UI failed to render:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6 text-slate-900">
          <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <h1 className="text-xl font-bold">This page couldn’t be displayed</h1>
            <p className="mt-2 text-sm text-slate-600">
              Something went wrong while loading this page. Refresh to try again. If it continues, please share this message with the DevSync support team.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Refresh page
            </button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <AuthProvider>
          <AppErrorBoundary>
            <App />
          </AppErrorBoundary>
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
  </React.StrictMode>,
)
