# Deployment (Vercel)

This project is a standard **Next.js App Router** application and deploys cleanly to [Vercel](https://vercel.com/).

## Steps

1. Push the repository to GitHub (for example `https://github.com/Mhd-Hashaam/RFP-Renderer.git`).
2. In Vercel, **Import Project** → select the repository.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build` (default).
5. Output: Next default (`.next`).

## Node version

The repo includes [`.nvmrc`](../.nvmrc) and `engines.node` in `package.json`. Vercel should pick a compatible Node LTS automatically; if needed, set **Node.js Version** in Project Settings to match `.nvmrc`.

## Environment variables

No secrets are required for the current mock-data implementation.

## Preview deployments

Pull requests receive **Preview** deployments automatically when Vercel is connected to GitHub.
