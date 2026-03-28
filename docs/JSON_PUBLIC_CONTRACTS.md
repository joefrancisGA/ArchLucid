# JSON naming for public HTTP contracts

## API controllers

`ArchiForge.Api` configures MVC JSON serialization with **camelCase** property names and **camelCase** dictionary keys (`AddJsonOptions` in `Startup/MvcExtensions.cs`). Public JSON responses and request bodies from controllers should use **PascalCase in C#** on DTOs and rely on this policy for wire format.

## Problem Details

Error responses include:

- `type`, `title`, `status`, `detail`, `instance` (RFC 7807).
- `extensions.errorCode` — stable machine code (see `ArchiForge.Api.ProblemDetails.ProblemErrorCodes`).
- Additional `extensions` as documented per error (e.g. `retryAfterUtc`, `driftDetected`).

## OpenAPI / clients

Generated clients should assume **camelCase** JSON unless a specific DTO opts out with `JsonPropertyName` for an exception.
