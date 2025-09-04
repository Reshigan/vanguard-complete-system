// Verifi Wordmark Component
export const VerifiWordmark = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { fontSize: '1.5rem', logoSize: 24 },
    md: { fontSize: '2rem', logoSize: 32 },
    lg: { fontSize: '2.5rem', logoSize: 40 },
    xl: { fontSize: '3rem', logoSize: 48 },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <VerifiLogo size={currentSize.logoSize} />
      <span
        style={{
          fontSize: currentSize.fontSize,
          fontWeight: 700,
          color: '#334155',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Verifi
      </span>
    </div>
  );
};

// Utility functions for brand consistency
export const getBrandColor = (color, shade = 500) => {
  return VerifiBrand.colors[color]?.[shade] || color;
};

export const getBrandSpacing = (size) => {
  return VerifiBrand.spacing?.[size] || size;
};

export const getBrandRadius = (size) => {
  return VerifiBrand.borderRadius?.[size] || size;
};
// Verifi Brand Identity System
export const VerifiBrand = {
  // Brand Colors
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Main green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Red for warnings
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    success: '#22c55e',
    // ...existing code...
  },
  // ...existing code...
};

// Verifi Logo Component (SVG)
export const VerifiLogo = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Checkmark in circle */}
    <circle cx="16" cy="16" r="15" fill="#22c55e" stroke="#16a34a" strokeWidth="2"/>
    <path
      d="M9 16l3 3 8-8"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Verifi Wordmark Component
// ...existing code...
