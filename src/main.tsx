import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './app/App'

// Error boundary to catch white screen crashes and show readable error
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '16px',
          fontFamily: "'Chewy', cursive", background: '#FFE033', padding: '24px',
        }}>
          <div style={{ fontSize: '3rem' }}>🚫</div>
          <h1 style={{ fontSize: '1.6rem', color: '#1A1A1A', margin: 0 }}>Algo salió mal</h1>
          <pre style={{
            background: '#1A1A1A', color: '#FFE033', padding: '16px',
            borderRadius: '12px', fontSize: '0.8rem', maxWidth: '90vw',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>{this.state.error}</pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 28px', borderRadius: '50px',
              background: '#B8E04A', border: '3px solid #1A1A1A',
              fontFamily: "'Chewy', cursive", fontSize: '1rem',
              cursor: 'pointer', boxShadow: '3px 3px 0 #1A1A1A',
            }}
          >Reintentar 🔄</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
