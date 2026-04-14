# Security Policy

## Supported Versions

This project is currently maintained on the default branch only.

| Version | Supported |
| --- | --- |
| `main` (latest) | Yes |
| Older commits/releases | No |

## Reporting a Vulnerability

Please do **not** open public GitHub issues for security vulnerabilities.

Use one of these private channels:

1. GitHub Security Advisory (preferred)
   - Go to this repository's `Security` tab.
   - Click `Report a vulnerability`.
2. If Security Advisories are unavailable, contact the repository owner directly and include `[SECURITY]` in the subject.

Include the following details in your report:

- Affected file(s) and feature path(s)
- Reproduction steps
- Impact assessment (confidentiality, integrity, availability)
- Suggested fix (if available)

## Response Expectations

- Initial triage acknowledgement target: within 5 business days
- Status update cadence: at least weekly until resolution
- Coordinated disclosure is preferred; please avoid public disclosure before a fix is available

## Security Scope and Deployment Notes

This repository contains a browser-based Meilisearch admin UI.

Current architecture notes:

- API keys can be entered and stored in browser `localStorage`
- The app performs direct client-to-Meilisearch API calls
- The app does not implement first-party authentication/authorization in this repo

Because of the above, this codebase should be treated as **internal tooling** unless additional hardening is implemented.

For public internet deployment, at minimum:

- Remove persistent browser storage of privileged credentials
- Add authentication and role-based authorization controls
- Enforce security headers and framing protections at the edge
- Restrict destination hosts and key scopes

## Safe Harbor

Security testing intended to improve this project is welcome, provided it:

- Avoids privacy violations and service disruption
- Avoids data destruction or unauthorized persistence changes
- Does not use social engineering or physical attacks
- Is conducted only against systems you are authorized to test
