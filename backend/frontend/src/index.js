import React from "react";
import ReactDOM from "react-dom/client";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById("root"));

function StartupConfigNotice() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f7f8fa',
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>
          Startup check
        </div>
        <h1 style={{ margin: '12px 0 8px', fontSize: '24px', lineHeight: 1.2 }}>
          Frontend API configuration is missing
        </h1>
        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#4b5563' }}>
          Set <code>REACT_APP_API_BASE_URL</code> in the frontend Vercel project to the backend URL, then redeploy.
        </p>
        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#111827',
            wordBreak: 'break-word'
          }}
        >
          Example:
          <br />
          <code>REACT_APP_API_BASE_URL=https://&lt;your-backend-project&gt;.vercel.app</code>
        </div>
      </div>
    </div>
  );
}

const configuredBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();
const isProductionBuild = process.env.NODE_ENV === 'production';

if (isProductionBuild && !configuredBaseUrl) {
  root.render(<StartupConfigNotice />);
} else {
  import('./app')
    .then(({ default: App }) => {
      root.render(<App />);
    })
    .catch((error) => {
      console.error('Failed to load application shell:', error);
      root.render(<StartupConfigNotice />);
    });
}
