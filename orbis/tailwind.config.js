/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas:  '#000000',
        surface: '#0d1117',
        raised:  '#161b22',
        border:  '#21262d',
        'border-muted': '#30363d',
        text:    '#e6edf3',
        muted:   '#8b949e',
        faint:   '#484f58',
        accent:  '#2f81f7',
        'accent-hover': '#388bfd',
        green:   '#3fb950',
        amber:   '#d29922',
        red:     '#f85149',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
