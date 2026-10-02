# Mastered

Une PWA pour t'aider à atteindre tes objectifs : rappels, alarmes bloquantes
opt-in à l'échéance, et un Veilleur pour t'accompagner.

## Stack

Next.js (App Router) · Drizzle ORM · Neon Postgres · Tailwind + shadcn/ui
(base-ui) · Resend (email) · Web Push · Vercel Blob.

## Développement

```bash
npm install
npm run dev       # http://localhost:3001
npm test          # tests unitaires (logique streaks/grâce)
npm run build     # build de production
```

Variables d'environnement requises : voir `.env.example`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`) : lint, type-check, tests, build sur
  chaque push et pull request.
- **Protection de branche** sur `main` : la CI doit passer avant de
  fusionner une PR.

## Déploiement

Connecté à Vercel : preview sur chaque PR, prod sur merge vers `main`.
