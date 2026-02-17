# Invoicia UI (Next.js)

This package is the standalone UI app under `invoicia-saa-s-ui/`.

## Troubleshooting: changes not reflecting

If you do **not** see the bright **Route Proof** badge in the top-right, you are probably running a different Next.js app in this monorepo (e.g. `apps/invoicia`) instead of `invoicia-saa-s-ui`.

1) Stop the dev server (Ctrl+C).

2) Clear Next.js + tooling caches:

```bash
pnpm clean
```

3) Start the dev server again:

```bash
pnpm dev
```

4) If Turbopack is involved, use the explicit script:

```bash
pnpm dev:turbo
```

### Notes

- This UI project runs on `http://localhost:3000` by default.
- `pnpm dev` uses the Webpack dev server (`next dev --webpack`).
- To use Turbopack intentionally, run `pnpm dev:turbo`.
- If another app is already using port 3000, stop it or run this UI on a different port:
  - `pnpm dev:3001`

### Windows PowerShell equivalents

```powershell
pnpm clean
pnpm dev
```
