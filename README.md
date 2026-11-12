# Vastra

Vastra is a React/Vite storefront with a Node.js API for catalog management,
orders, and group carts.

## Requirements

- Node.js 20.12 or newer

## Run locally

Start the API in one terminal:

```powershell
Set-Location .\backend
npm run dev
```

Start the storefront in another terminal:

```powershell
Set-Location .\frontend\vastra
npm ci
npm run dev
```

The Vite development server proxies `/api` requests to `http://localhost:5000`.

## Environment setup

- Copy `backend/.env.example` to `backend/.env` and set any required backend
  secrets. Keep `.env` private.
- Copy `frontend/vastra/.env.example` to `frontend/vastra/.env.local` and set
  the Supabase project URL and publishable/anon key if using authentication.
- See [frontend/vastra/README.md](./frontend/vastra/README.md) and
  [backend/README.md](./backend/README.md) for setup details.

Backend JSON data is kept locally in `backend/data/` and is intentionally
excluded from Git because it can contain order and customer information. Use
persistent storage or a database for production deployments.
