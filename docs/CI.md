# Continuous integration

GitHub Actions runs on every `push` and `pull_request` targeting `main`:

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

## Local parity

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Vitest runs pure layout tests in Node/jsdom without starting Next.js.
