# Smart-Bookmarks

Smart bookmark manager built with Next.js and Supabase (Google OAuth).

## Setup

1) Install deps

```bash
npm install
```

2) Configure env vars

Create `.env.local` in the project root (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3) Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Notes

- If you add env vars while the dev server is running, fully restart `npm run dev` (and delete `.next` if it still doesn’t pick them up).
- For cross-tab delete events via Supabase Realtime, consider enabling `REPLICA IDENTITY FULL` on the `bookmarks` table.
