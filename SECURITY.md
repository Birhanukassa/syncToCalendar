# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public issue
2. Email us at: security@yourdomain.com
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- We will acknowledge receipt within 48 hours
- We will provide a detailed response within 7 days
- We will keep you informed of our progress

## Security Best Practices

### For Users
- Keep your API tokens secure
- Use environment variables for sensitive data
- Regularly rotate your API credentials
- Monitor your calendar for unexpected changes

### For Developers
- Never commit API keys or secrets
- Use secure credential storage (PropertiesService)
- Implement proper error handling
- Follow OAuth2 best practices

## Security Features

This project includes several security features:
- Secure credential storage using Google Apps Script PropertiesService
- OAuth2 authentication for Google Fit API
- Input validation and sanitization
- Error handling that doesn't expose sensitive information
- Rate limiting and retry logic

## Dependencies

We regularly audit our dependencies for security vulnerabilities:
- Run `npm audit` to check for known vulnerabilities
- Keep dependencies up to date
- Use `npm audit fix` to automatically fix vulnerabilities

## Contact

For security-related questions or concerns, please contact us at security@yourdomain.com
