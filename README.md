# KLUB

Run club discovery platform. PWA · Angular 17 · Node/Express · PostgreSQL.

## Setup

```bash
cp .env.example .env
npm install
psql klubdb < backend/src/db/schema.sql
npm run dev
```

## Scripts
| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend |
| `npm run dev:frontend` | Angular dev server :4200 |
| `npm run dev:backend` | Node API :3000 |
| `npm run build:frontend` | Production PWA build |
