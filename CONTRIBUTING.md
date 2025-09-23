# Contributing to Google Calendar Sync

Thank you for your interest in contributing to this project! This document provides guidelines and information for contributors.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/google-calendar-sync.git
   cd google-calendar-sync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   npm run dev
   ```

## Code Standards

### Linting and Formatting
- We use ESLint for code linting
- Prettier for code formatting
- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format` to format code

### Testing
- Write tests for new features
- Run `npm test` to execute all tests
- Maintain test coverage above 80%

### Commit Messages
Follow conventional commit format:
```
type(scope): description

feat(calendar): add support for recurring events
fix(toggl): resolve API rate limiting issue
docs(readme): update installation instructions
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run validate`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Code Review Guidelines

- All code must be reviewed before merging
- Ensure tests pass and coverage is maintained
- Follow the existing code style and patterns
- Update documentation for new features

## Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
