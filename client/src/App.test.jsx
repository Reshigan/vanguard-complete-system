import React from 'react'

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          AuthentiGuard System
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
          System is running successfully!
        </p>
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.5rem' }}>
          <p style={{ color: '#166534' }}>✅ Client is working</p>
          <p style={{ color: '#166534' }}>✅ React is rendering</p>
          <p style={{ color: '#166534' }}>✅ No CSS dependencies</p>
        </div>
      </div>
    </div>
  )
}

export default App