// SECURITY: Production credentials must NEVER be hardcoded.
// Values are injected at build time from environment variables
// via scripts/set-env.ts or the CI/CD pipeline.
export const environment = {
  production: true,
  supabaseUrl: '__SUPABASE_URL__',
  supabaseKey: '__SUPABASE_ANON_KEY__',
};
