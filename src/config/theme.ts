



export const theme = {
    
    primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',  
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
    },

    
    neutral: {
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
        950: '#020617',
    },

    
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',

    
    gradients: {
        primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        card: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)',
        hero: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    },

    
    radius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
    },

    
    shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px -1px rgba(0,0,0,0.1)',
        lg: '0 10px 15px -3px rgba(0,0,0,0.1)',
        xl: '0 20px 25px -5px rgba(0,0,0,0.1)',
        glow: '0 0 20px rgba(99,102,241,0.3)',
    },

    
    transition: {
        fast: '150ms ease',
        base: '250ms ease',
        slow: '350ms ease',
    },

    
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};


export const generateCSSVariables = (): string => {
    return `
    :root {
      --primary-50: ${theme.primary[50]};
      --primary-100: ${theme.primary[100]};
      --primary-200: ${theme.primary[200]};
      --primary-300: ${theme.primary[300]};
      --primary-400: ${theme.primary[400]};
      --primary-500: ${theme.primary[500]};
      --primary-600: ${theme.primary[600]};
      --primary-700: ${theme.primary[700]};
      --primary-800: ${theme.primary[800]};
      --primary-900: ${theme.primary[900]};

      --neutral-50: ${theme.neutral[50]};
      --neutral-100: ${theme.neutral[100]};
      --neutral-200: ${theme.neutral[200]};
      --neutral-300: ${theme.neutral[300]};
      --neutral-400: ${theme.neutral[400]};
      --neutral-500: ${theme.neutral[500]};
      --neutral-600: ${theme.neutral[600]};
      --neutral-700: ${theme.neutral[700]};
      --neutral-800: ${theme.neutral[800]};
      --neutral-900: ${theme.neutral[900]};
      --neutral-950: ${theme.neutral[950]};

      --success: ${theme.success};
      --warning: ${theme.warning};
      --danger: ${theme.danger};
      --info: ${theme.info};

      --gradient-primary: ${theme.gradients.primary};
      --gradient-dark: ${theme.gradients.dark};
      --gradient-card: ${theme.gradients.card};
      --gradient-hero: ${theme.gradients.hero};

      --radius-sm: ${theme.radius.sm};
      --radius-md: ${theme.radius.md};
      --radius-lg: ${theme.radius.lg};
      --radius-xl: ${theme.radius.xl};
      --radius-full: ${theme.radius.full};

      --shadow-sm: ${theme.shadows.sm};
      --shadow-md: ${theme.shadows.md};
      --shadow-lg: ${theme.shadows.lg};
      --shadow-xl: ${theme.shadows.xl};
      --shadow-glow: ${theme.shadows.glow};

      --transition-fast: ${theme.transition.fast};
      --transition-base: ${theme.transition.base};
      --transition-slow: ${theme.transition.slow};

      --font-family: ${theme.fontFamily};
    }
  `;
};
