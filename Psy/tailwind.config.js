/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2d2d2d',
          light: '#404040',
          dark: '#1a1a1a',
        },
        secondary: {
          DEFAULT: '#f5f0e8',
          light: '#ffffff',
          dark: '#e8e0d4',
        },
        accent: {
          red: '#e74c3c',
          blue: '#3498db',
          orange: '#f39c12',
          purple: '#9b59b6',
        },
        // Collage Art 颜色别名
        'accent-red': '#e74c3c',
        'accent-blue': '#3498db',
        'accent-orange': '#f39c12',
        'accent-purple': '#9b59b6',
        background: {
          DEFAULT: '#f5f0e8',
          cream: '#f5f0e8',
          warm: '#faf8f5',
        },
        surface: {
          DEFAULT: '#ffffff',
          elevated: '#fafafa',
          card: '#ffffff',
        },
        text: {
          primary: '#2d2d2d',
          secondary: '#666666',
          muted: '#999999',
        },
        border: {
          DEFAULT: '#2d2d2d',
          dark: '#2d2d2d',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        heading: ['Inter', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        'brutal': '4px 4px 0px 0px rgba(0,0,0,1)',
        'brutal-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'brutal-sm': '3px 3px 0px 0px rgba(0,0,0,1)',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '0px',
        'md': '0px',
        'lg': '0px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 18s linear infinite',
      },
    },
  },
  plugins: [],
};
