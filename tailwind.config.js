/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
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
        // Native-feel semantic colors
        gain: {
          DEFAULT: '#00C853',
          light: '#E8F5E9',
          dark: '#00A844',
        },
        loss: {
          DEFAULT: '#FF3D00',
          light: '#FFEBEE',
          dark: '#DD2C00',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FAFAFA',
          muted: '#F3F4F6',
        },
      },
      animation: {
        // Page & Modal Transitions
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-out': 'fadeOut 300ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'slide-in-left': 'slideInLeft 300ms ease-out',
        'slide-in-up': 'slideInUp 300ms ease-out',
        'slide-in-down': 'slideInDown 300ms ease-out',
        'scale-in': 'scaleIn 300ms ease-out',
        
        // Card & Element Animations
        'card-pop': 'cardPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'card-hover-lift': 'cardLift 200ms ease-out',
        'card-glow': 'cardGlow 2s ease-in-out infinite',
        
        // Pulse & Activity
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-breathing': 'breathing 3s ease-in-out infinite',
        'dot-pulse': 'dotPulse 1.4s ease-in-out infinite',
        
        // Floating & Bounce
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 1s infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        
        // Loading States
        'skeleton-loading': 'skeletonLoading 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        
        // Button & Interactive
        'button-press': 'buttonPress 150ms ease-out',
        'button-ripple': 'ripple 600ms ease-out',
        'shake': 'shake 500ms ease-in-out',
        'jiggle': 'jiggle 400ms ease-in-out',
        
        // Text & Number
        'number-flip': 'numberFlip 600ms ease-out',
        'text-shimmer': 'textShimmer 3s ease-in-out infinite',
        
        // Advanced
        'morph': 'morph 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-infinite infinite',
        // Native-feel animations
        'press': 'press 100ms ease-out',
        'slide-up-fade': 'slideUpFade 200ms ease-out',
        'scale-fade-in': 'scaleFadeIn 200ms ease-out',
      },
      keyframes: {
        // Page Transitions
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },

        // Card Animations
        cardPop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        cardLift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-4px)' },
        },
        cardGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(99, 102, 241, 0.1)' },
        },

        // Pulse Variations
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        breathing: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        dotPulse: {
          '0%, 60%, 100%': { opacity: '0.3' },
          '30%': { opacity: '1' },
        },

        // Floating & Bounce
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-1deg)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },

        // Loading States
        skeletonLoading: {
          '0%': { backgroundPosition: '1000px 0' },
          '100%': { backgroundPosition: '-1000px 0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },

        // Button & Interactive
        buttonPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        ripple: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        jiggle: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.05) rotate(-2deg)' },
          '75%': { transform: 'scale(1.05) rotate(2deg)' },
        },

        // Text Animations
        numberFlip: {
          '0%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0)' },
        },
        textShimmer: {
          '0%, 100%': { backgroundPosition: '0 center' },
          '50%': { backgroundPosition: '1000px center' },
        },

        // Advanced
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        // Native-feel keyframes
        press: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
        },
        slideUpFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleFadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      backgroundSize: {
        'shimmer': '1000px 100%',
      },

      boxShadow: {
        // Elevated shadows for native feel
        'glow': '0 0 20px rgba(99, 102, 241, 0.25)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.15)',
        'elevated': '0 10px 30px rgba(0, 0, 0, 0.12)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'button-active': '0 0 0 3px rgba(99, 102, 241, 0.2)',
      },

      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [
    // Custom plugin for smooth transitions
    function ({ addUtilities }) {
      addUtilities({
        '.transition-smooth': {
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-fast': {
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.transition-slow': {
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.will-change-transform': {
          willChange: 'transform',
        },
      })
    },
  ],
}