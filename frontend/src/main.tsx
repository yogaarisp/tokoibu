import { StrictMode, Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// Error boundary global — cegah white screen saat ada error render
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-slate-50">
          <h1 className="text-xl font-bold text-slate-800">Terjadi kesalahan</h1>
          <p className="text-sm text-slate-500 text-center max-w-sm">
            Aplikasi mengalami error tak terduga. Coba muat ulang halaman.
          </p>
          <pre className="text-xs text-red-600 bg-red-50 p-3 rounded-xl max-w-md overflow-auto">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '12px', fontSize: '14px' },
            success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
