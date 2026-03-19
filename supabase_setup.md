# Supabase Setup Guide for KCSE AI Exam Platform

To connect your project to Supabase, follow these steps:

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Once the project is created, go to **Project Settings** -> **API**.
3. Copy the **Project URL** and **anon public** key.
4. Go to **Project Settings** -> **API** and copy the **service_role** key (keep this secret!).

## 2. Set Up Environment Variables
In AI Studio, go to **Settings** -> **Secrets** and add the following:

- `VITE_SUPABASE_URL`: Your Project URL.
- `VITE_SUPABASE_ANON_KEY`: Your anon public key.
- `SUPABASE_URL`: Your Project URL (same as above).
- `SUPABASE_SERVICE_ROLE_KEY`: Your service_role key.

## 3. Initialize the Database Schema
1. In Supabase, go to the **SQL Editor**.
2. Click **New query**.
3. Copy the contents of the `supabase_schema.sql` file in your project and paste it into the SQL Editor.
4. Click **Run**.

## 4. Using Supabase in Your Code
- **Frontend**: Use the `supabase` client from `src/lib/supabase.ts`.
- **Backend**: Use the `supabaseServer` client from `src/lib/supabaseServer.ts`.

### Example (Frontend):
```tsx
import { supabase } from './lib/supabase';

const fetchSubjects = async () => {
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) console.error(error);
  return data;
};
```

### Example (Backend):
```ts
import { supabase } from './src/lib/supabaseServer';

app.get('/api/subjects', async (req, res) => {
  const { data, error } = await supabase.from('subjects').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
```

## 5. Migration (Optional)
If you want to fully migrate from SQLite to Supabase, you will need to replace the `db.prepare(...).run/get/all(...)` calls in `server.ts` with the corresponding Supabase client calls.
