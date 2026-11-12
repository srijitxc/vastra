# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Group cart API

The group cart uses the Node.js API in `../../backend`. Run it in one terminal:

```powershell
cd ..\..\backend
npm run dev
```

Run the frontend in another terminal:

```powershell
npm run dev
```

Vite proxies `/api` requests to `http://localhost:5000`. The backend creates `backend/data/groups.json` to persist groups; keep this directory on a persistent disk when deploying. Set `PORT` to change the API port, `CORS_ORIGINS` to a comma-separated list of frontend origins, and `VITE_GROUP_CART_API_URL` in the frontend build to the API's `/api` URL when the API is hosted separately.

Invite codes grant access to view and edit a group, so only share them with people you trust. This prototype does not have user authentication or role-based permissions.

## Admin portal

The admin portal is available at `/admin`. Configure `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` in the backend environment using
`../../backend/.env.example` as a template, then restart the backend. The admin
can add/remove storefront products, update order statuses, and record COD
payments as due or paid. It does not process online payments.

## Supabase authentication

1. In Supabase, copy the project URL and the **publishable** key (or legacy anon public key) from Project Settings → API.
2. Copy `.env.example` to `.env.local` in this frontend folder and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `.env.local` is ignored by Git. Never put a Supabase `service_role` or secret key in a `VITE_` variable or browser code.
3. In the Supabase SQL Editor, run these migrations in order for a new setup: `../../supabase/migrations/20261109000000_create_profiles.sql`, `../../supabase/migrations/20261109000001_add_profile_avatars.sql`, then `../../supabase/migrations/20261109000002_backfill_existing_profiles.sql`. If the first two have already been applied, run only the final backfill migration; it creates profile rows for accounts that existed before the signup trigger was installed.
4. Enable Email under Authentication → Providers. Add your local app URL (the Vite URL, commonly `http://localhost:5173`) to Authentication → URL Configuration → Redirect URLs.
5. Restart the Vite server after editing `.env.local`.

The login and signup pages use Supabase email/password auth, signup email confirmation, and password reset. Signed-in users can edit their profile and upload an avatar from `/profile`. The current group-cart API is still the separate invite-code JSON prototype; authentication and database permissions have not yet been connected to group-cart data.
