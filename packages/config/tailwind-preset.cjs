/**
 * OGFN Tailwind preset.
 *
 * ADR: Colors are expressed as `rgb(var(--c-<token>) / <alpha-value>)` so the runtime theme
 * engine can swap every color by rewriting CSS custom properties on :root — no rebuild,
 * no class churn, and opacity modifiers (`bg-accent/20`) keep working.
 */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const TOKENS = [
  'bg-base', 'bg-rail', 'bg-topbar', 'bg-panel', 'bg-elevated', 'bg-hover', 'bg-input',
  'border', 'border-strong',
  'text-primary', 'text-secondary', 'text-muted',
  'accent', 'accent-hover', 'accent-contrast',
  'meteor-from', 'meteor-via', 'meteor-to',
  'success', 'warning', 'danger', 'info', 'focus', 'vbucks',
  'hero-sky-top', 'hero-sky-bottom',
];

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: Object.fromEntries(TOKENS.map((t) => [t, token(t)])),
      borderRadius: {
        theme: 'var(--radius)',
        'theme-sm': 'calc(var(--radius) * 0.5)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bungee', 'Impact', 'sans-serif'],
        body: ['Inter', 'Rubik', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        ui: ['13px', { lineHeight: '18px', letterSpacing: '-0.01em' }],
        body: ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
        'body-lg': ['15px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
      },
      transitionTimingFunction: { launcher: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      transitionDuration: { launcher: '150ms' },
      keyframes: {
        'skeleton-pulse': { '0%,100%': { opacity: '0.45' }, '50%': { opacity: '0.8' } },
        'toast-in': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
      },
      animation: {
        skeleton: 'skeleton-pulse 1.4s ease-in-out infinite',
        'toast-in': 'toast-in 150ms ease-out',
      },
    },
  },
  TOKENS,
};
