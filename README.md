# Noctuary

A lunar observatory around a living Moon. Expo SDK 58, runs in Expo Go.

```sh
npm install
npx expo start            # phone and computer on the same Wi-Fi
npx expo start --tunnel   # campus Wi-Fi; run `npx expo login` first
```

Needs `.env.local` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`. The plan is in `PLAN.md`; the database in `supabase/schema.sql`; the Moon answers through `supabase/functions/speak` (secret `GROQ_API_KEY`).
