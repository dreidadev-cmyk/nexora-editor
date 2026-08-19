# Nexora Editor

Nexora Editor is a browser-based development environment with AI-assisted coding and project deployment validation.

## Production configuration

Copy `.env.example` to your local environment and configure deployment secrets through your hosting provider. **Never commit `.env` files or API keys.**

The server supports configurable AI model settings, request-size limits, project-file limits, server settings, and deployment command recommendations.

## Validation scope

`/api/deploy/validate` performs **static validation only**. It checks project structure and generates deployment configuration; it does not execute or compile untrusted user projects. A successful validation must not be interpreted as a completed production build.

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Security notes

- Keep `GEMINI_API_KEY` server-side.
- Do not expose provider secrets through `VITE_*` variables.
- AI request limits are configurable through `NEXORA_AI_MAX_FILE_CHARS`, `NEXORA_AI_MAX_PROJECT_FILES`, and `NEXORA_AI_MAX_REQUEST_CHARS`.
- Production API errors are sanitized and internal details are logged server-side.
