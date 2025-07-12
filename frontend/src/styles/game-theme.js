/**
 * Game theme and styling for Soundbeats
 * Provides a consistent visual identity distinct from Home Assistant's default theme
 */

export const gameTheme = {
  // Color palette
  colors: {
    primary: '#667eea',
    primaryDark: '#5a67d8',
    secondary: '#764ba2', 
    accent: '#f093fb',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    // Gradients
    backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardGradient: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    successGradient: 'linear-gradient(135deg, #4caf50, #66bb6a)',
    warningGradient: 'linear-gradient(135deg, #ff9800, #ffb74d)',
    errorGradient: 'linear-gradient(135deg, #f44336, #e57373)',
    
    // Text colors
    textPrimary: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    
    // Background colors
    cardBackground: 'rgba(255, 255, 255, 0.1)',
    overlayBackground: 'rgba(0, 0, 0, 0.3)',
    glassBackground: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Typography
  typography: {
    fontFamily: '"Roboto", "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    base: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  // Border radius
  borderRadius: {
    sm: '0.25rem',
    base: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(102, 126, 234, 0.3)',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    tooltip: 1100,
    toast: 1200,
  },
  
  // Animations
  animations: {
    duration: {
      fast: '150ms',
      base: '300ms',
      slow: '500ms',
    },
    
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  
  // Breakpoints for responsive design
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
  },
};

// CSS custom properties for use in components
export const cssVariables = `
  :host {
    /* Colors */
    --game-primary: ${gameTheme.colors.primary};
    --game-primary-dark: ${gameTheme.colors.primaryDark};
    --game-secondary: ${gameTheme.colors.secondary};
    --game-accent: ${gameTheme.colors.accent};
    --game-success: ${gameTheme.colors.success};
    --game-warning: ${gameTheme.colors.warning};
    --game-error: ${gameTheme.colors.error};
    --game-info: ${gameTheme.colors.info};
    
    /* Gradients */
    --game-bg-gradient: ${gameTheme.colors.backgroundGradient};
    --game-card-gradient: ${gameTheme.colors.cardGradient};
    --game-success-gradient: ${gameTheme.colors.successGradient};
    --game-warning-gradient: ${gameTheme.colors.warningGradient};
    --game-error-gradient: ${gameTheme.colors.errorGradient};
    
    /* Text */
    --game-text-primary: ${gameTheme.colors.textPrimary};
    --game-text-secondary: ${gameTheme.colors.textSecondary};
    --game-text-muted: ${gameTheme.colors.textMuted};
    
    /* Backgrounds */
    --game-card-bg: ${gameTheme.colors.cardBackground};
    --game-overlay-bg: ${gameTheme.colors.overlayBackground};
    --game-glass-bg: ${gameTheme.colors.glassBackground};
    
    /* Typography */
    --game-font-family: ${gameTheme.typography.fontFamily};
    
    /* Spacing */
    --game-space-xs: ${gameTheme.spacing.xs};
    --game-space-sm: ${gameTheme.spacing.sm};
    --game-space-base: ${gameTheme.spacing.base};
    --game-space-lg: ${gameTheme.spacing.lg};
    --game-space-xl: ${gameTheme.spacing.xl};
    
    /* Border radius */
    --game-radius-sm: ${gameTheme.borderRadius.sm};
    --game-radius-base: ${gameTheme.borderRadius.base};
    --game-radius-lg: ${gameTheme.borderRadius.lg};
    --game-radius-xl: ${gameTheme.borderRadius.xl};
    --game-radius-2xl: ${gameTheme.borderRadius['2xl']};
    --game-radius-full: ${gameTheme.borderRadius.full};
    
    /* Shadows */
    --game-shadow-sm: ${gameTheme.shadows.sm};
    --game-shadow-base: ${gameTheme.shadows.base};
    --game-shadow-md: ${gameTheme.shadows.md};
    --game-shadow-lg: ${gameTheme.shadows.lg};
    --game-shadow-xl: ${gameTheme.shadows.xl};
    --game-shadow-glow: ${gameTheme.shadows.glow};
    
    /* Animation */
    --game-duration-fast: ${gameTheme.animations.duration.fast};
    --game-duration-base: ${gameTheme.animations.duration.base};
    --game-duration-slow: ${gameTheme.animations.duration.slow};
    
    --game-ease-linear: ${gameTheme.animations.easing.linear};
    --game-ease-in: ${gameTheme.animations.easing.easeIn};
    --game-ease-out: ${gameTheme.animations.easing.easeOut};
    --game-ease-in-out: ${gameTheme.animations.easing.easeInOut};
    --game-ease-bounce: ${gameTheme.animations.easing.bounce};
  }
`;

// Utility functions for styling
export const styleUtils = {
  // Generate glassmorphism effect
  glass: (opacity = 0.1, blur = 10) => `
    background: rgba(255, 255, 255, ${opacity});
    backdrop-filter: blur(${blur}px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  `,
  
  // Generate gradient background
  gradient: (color1, color2, angle = 135) => `
    background: linear-gradient(${angle}deg, ${color1}, ${color2});
  `,
  
  // Generate text shadow for better readability
  textShadow: (color = 'rgba(0, 0, 0, 0.3)', blur = 2) => `
    text-shadow: 0 ${blur}px ${blur * 2}px ${color};
  `,
  
  // Generate responsive font size
  responsiveFont: (baseSize, mobileSize) => `
    font-size: ${baseSize};
    
    @media (max-width: ${gameTheme.breakpoints.md}) {
      font-size: ${mobileSize};
    }
  `,
};

export default gameTheme;