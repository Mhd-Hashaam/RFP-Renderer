const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Polyfill CSS @layer for Android 9/10 WebView (Chrome <99)
    // Rewrites @layer rules into specificity-equivalent selectors so
    // Tailwind v4 styles work on browsers that don't support @layer natively.
    "@csstools/postcss-cascade-layers": {},
  },
};

export default config;
