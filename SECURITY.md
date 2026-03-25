# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately.
Do NOT open a public GitHub issue.

## Security Practices

### Secrets Management
- All secrets (API keys, database URLs, JWT secrets) are stored in environment
  variables and loaded at build time via `scripts/set-env.ts`.
- The `.env` file is excluded from version control via `.gitignore`.
- See `.env.example` for the required variables.

### Authentication
- Authentication is handled by Supabase Auth.
- Passwords are hashed using bcrypt on the server side.
- Admin accounts should be provisioned via Supabase dashboard or a secure
  server-side script — never from client-side code.

### XSS Prevention
- Angular's default template binding (`{{ }}` and property binding) auto-escapes
  HTML output.
- Avoid `[innerHTML]` binding with any user-supplied or untrusted data.
- Use Angular's `DomSanitizer` only when absolutely necessary and after careful
  review.

### SQL Injection Prevention
- All database queries use the Supabase JS SDK's query builder, which
  parameterises values automatically.
- Raw SQL should only be executed via Supabase RPC functions with `$1`, `$2`
  parameter placeholders — never via string concatenation.

### CORS
- Allowed origins are configured via the `ALLOWED_ORIGINS` environment variable.
- Never use `Access-Control-Allow-Origin: *` in production.

### Password Hashing Best Practices
- **Recommended**: bcrypt (cost factor ≥ 12) or Argon2id.
- **Never use**: MD5, SHA-1, or plain SHA-256 for password storage.
