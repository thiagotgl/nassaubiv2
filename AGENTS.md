# AGENTS.md

Internal dashboards (Next.js 16 App Router + Tailwind) for Nassau/ImagemCor clinic, consuming Biodata APIs. UI and comments are in Portuguese (pt-BR). Deployed to Vercel; branch is `master`.

## Commands

```sh
npm run dev      # next dev
npm run build    # the real verification step — run this before finishing work
```

- There are **no tests**. Verification = `npm run build`.
- `npm run lint` is **broken**: `next lint` was removed in Next 16, so it fails with "Invalid project directory". Don't use or "fix" scripts around it without deciding on a replacement ESLint setup first.
- CI (`.github/workflows/ci.yml`, push/PR to `master`, Node 20) effectively runs `npm ci && npm run build`. Note the file has stray pasted diff lines (`- run:` / `+ run:` at the end) — malformed YAML; don't copy that pattern.

## Auth

- Root `middleware.ts` gates **every page** behind cookie `auth=true`; unauthenticated users are redirected to `/login`. Only `/login`, `/api`, `/_next`, `/static`, `/favicon.ico` bypass auth.
- A new page under `app/` automatically requires login. To exempt one, add it to both `publicPaths` and the `matcher` in `middleware.ts`.

## Backend / data flow

- `next.config.mjs` rewrites `/api/:path*` → hardcoded external backend `http://136.112.228.146:3000/api/:path*`. Rewrites run after filesystem routes, so local handlers like `app/api/faturamento/route.ts` take precedence over the proxy.
- Biodata API base: `https://apis.biodataweb.net/ImagemCor544/biodata/dashboard/grafico`. It's called **from the browser** in `app/painel-descontos/page.tsx` and `app/painel-imagemcor/page.tsx`, and server-side with hardcoded ASP.NET session cookies in `app/api/faturamento/route.ts` (those cookies are placeholders/stale — requests may 500).
- No env vars are used anywhere; endpoints/IPs are hardcoded. Changing backend targets means editing `next.config.mjs` and/or the fetch calls above.

## Quirks

- `package.json` pins exact `next@16.0.7` / `react@18.3.1` / `react-dom@18.3.1` (React 18 with Next 16 is unusual but intentional here); don't bump React as drive-by.
- `tsconfig.json`: `strict: false`, and `app/page.tsx.bak` is explicitly included — a stale backup file kept compiling. Leave it alone unless asked.
