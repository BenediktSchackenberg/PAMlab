# Contributing to PAMlab

Thank you for your interest in contributing to PAMlab! 🎉

## Code of Conduct

Be respectful, constructive, and inclusive. We're all here to build something useful.

## How to Contribute

### Reporting Bugs

1. Check if the issue already exists
2. Open a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node.js version, Docker version)

### Suggesting Features

Open an issue with the `enhancement` label. Describe:
- The use case / scenario you want to support
- Which mock API(s) would be affected
- Example API requests/responses if applicable

### Pull Requests

1. **Fork** the repository
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```
3. **Make your changes** following the code style of the existing codebase
4. **Sign your commits** (required):
   ```bash
   git commit -S -m "feat: add new endpoint for X"
   ```
5. **Push** to your fork and open a **Pull Request** against `main`
6. Wait for **code review** — at least one maintainer approval is required

### Commit Requirements

- **All commits must be signed** (GPG or SSH signature required)
  - [GitHub docs: Signing commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits)
- **Use conventional commit messages**:
  - `feat:` — New feature
  - `fix:` — Bug fix
  - `docs:` — Documentation only
  - `refactor:` — Code refactoring
  - `test:` — Adding or updating tests
  - `chore:` — Maintenance tasks

### Code Style

- **JavaScript/Node.js**: Follow existing patterns in the mock APIs
- **PowerShell**: Follow existing script patterns in `examples/powershell/`
- **React/TypeScript**: Follow existing patterns in `pamlab-studio/`

### What Makes a Good PR

- Small, focused changes (one feature per PR)
- Clear description of what and why
- No unnecessary file changes
- Tests or verification steps included
- Documentation updated if needed

## Development Setup

```bash
# Clone the repo
git clone https://github.com/BenediktSchackenberg/PAMlab.git
cd PAMlab

# Start all mock APIs
docker-compose up

# Or start individually
cd fudo-mock-api && npm install && npm start
cd matrix42-mock-api && npm install && npm start
cd ad-mock-api && npm install && npm start
```

## Project Structure

```
PAMlab/
├── fudo-mock-api/          # Fudo PAM API v2 Mock (Port 8443)
├── matrix42-mock-api/      # Matrix42 ESM API Mock (Port 8444)
├── ad-mock-api/            # Active Directory API Mock (Port 8445)
├── pamlab-studio/          # Web Frontend (Port 3000)
├── examples/powershell/    # PowerShell automation scripts
└── docker-compose.yml      # Run everything with one command
```

## Need Help?

- Open an issue with the `question` label
- Check existing issues and discussions

Thank you for helping make PAMlab better! 🚀
