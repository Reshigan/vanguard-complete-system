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
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Typography
  typography: {
    fontFamily: {
      primary: ['Inter', 'system-ui', 'sans-serif'],
      secondary: ['Roboto', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // Component Styles
  components: {
    button: {
      primary: {
        backgroundColor: '#22c55e',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 600,
        fontSize: '1rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 300ms ease',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
      secondary: {
        backgroundColor: '#f1f5f9',
        color: '#334155',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 600,
        fontSize: '1rem',
        border: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'all 300ms ease',
      },
      danger: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontWeight: 600,
        fontSize: '1rem',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 300ms ease',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      border: '1px solid #e2e8f0',
    },
    input: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      color: '#334155',
      outline: 'none',
      transition: 'all 300ms ease',
    },
  },
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
  return VerifiBrand.spacing[size] || size;
};

export const getBrandRadius = (size) => {
  return VerifiBrand.borderRadius[size] || size;
};

export default VerifiBrand;