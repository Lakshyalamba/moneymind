# MoneyMind AI Privacy Model

This document outlines the privacy protocols and data-handling mechanisms applied when interfacing with third-party Artificial Intelligence providers (such as Gemini, OpenAI, or local Ollama instances) inside MoneyMind.

---

## 1. Core Privacy Rules
To protect user data and ensure absolute privacy, the platform adheres to three strict guidelines:

1. **Explicit Consent & Auth Scope**: Users must be fully authenticated before any data retrieval or AI query runs. A user is only allowed to access and analyze their own database boundaries.
2. **Minimal Schema Exposure**: Only generic financial numbers (totals, values) and sanitized transaction logs are shared with the AI models.
3. **Strict Secrets Sanitation**: Under no circumstances will the platform transmit:
   - Passwords (hashed or plaintext)
   - JWT tokens / Session keys
   - Database credentials or connection URIs
   - System API keys or private variables

---

## 2. Data Sanitation Pipeline
Before forwarding user context (such as chat text or transaction notes) to the configured AI provider, MoneyMind runs it through a programmatic parser.

The utility recursively scans the context payload and replaces identifiable Personally Identifiable Information (PII) with generic tokens:

- **Emails**: Identifiable patterns are replaced with `[EMAIL]`.
- **Phone Numbers**: National and international standard number formats are replaced with `[PHONE]`.
- **IDs**: Database records are decoupled from internal UUIDs or auto-incrementing integer IDs before serialization.
