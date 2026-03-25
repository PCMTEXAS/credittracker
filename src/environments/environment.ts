// Environment variables are injected at build time via scripts/set-env.ts
// In local development, create a .env file (see .env.example) and run `npm run set-env`
//
// SECURITY: Never hardcode secrets here. Use placeholder tokens that are
// replaced at build time from environment variables.
export const environment = {
  production: false,
  supabaseUrl: '__SUPABASE_URL__',
  supabaseKey: '__SUPABASE_ANON_KEY__',
};
