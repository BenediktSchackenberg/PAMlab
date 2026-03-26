# Security Policy

## Reporting a Vulnerability

PAMlab is a **development and testing tool** with mock APIs that have **no real security**. This is by design.

However, if you find a security issue that could affect users of this project (e.g., accidental credential exposure, supply chain risks, or dependency vulnerabilities), please report it responsibly:

1. **Do NOT open a public issue** for security vulnerabilities
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include a description of the issue and steps to reproduce

## Scope

The following are **not** considered security vulnerabilities in PAMlab:

- Mock APIs accepting any authentication token (this is intentional)
- Lack of HTTPS on mock APIs (they are designed for localhost only)
- In-memory data being accessible without proper auth (mock behavior)

## Best Practices for Users

- Never use PAMlab in production
- Never commit real credentials to any repository
- Use `config/.env` (gitignored) for production credentials during development
- Always review the `production.env.template` before deploying scripts to real systems
