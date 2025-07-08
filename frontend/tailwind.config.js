/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'glass': {
          'bg': 'hsl(var(--base-hue) 25% 95% / 45%)',
          'bg-strong': 'hsl(var(--base-hue) 25% 95% / 65%)',
          'bg-subtle': 'hsl(var(--base-hue) 25% 95% / 25%)',
          'border': 'hsl(var(--base-hue) 75% 40% / 20%)',
        }
      },
      backdropBlur: {
        'glass': '1rem',
        'glass-subtle': '0.75rem',
      },
      borderRadius: {
        'glass': '1.5rem',
        'glass-small': '0.75rem',
      }
    },
  },
  plugins: [],
}