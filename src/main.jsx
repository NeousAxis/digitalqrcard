import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', height: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>Application Error</h1>
          <p style={{ maxWidth: '600px', textAlign: 'center', marginBottom: '2rem', color: '#94a3b8' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <details style={{ maxWidth: '600px', background: '#1e293b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', whiteSpace: 'pre-wrap', overflow: 'auto' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>View Error Stack</summary>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            onClick={() => {
              // Clear Service Workers and Cache before reload
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function (registrations) {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
              window.location.reload();
            }}
            style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' }}
          >
            Force Reload & Clear Cache
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
