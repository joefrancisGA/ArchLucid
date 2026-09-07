# DR-14 — Advisory-draft operations are durable

**Do not merge** draft and review kernels. **Do not fork LK-12** conflict UX. Replace the **in-memory** advisory-draft operation store.

## Goal

`InMemoryAdvisoryDraftOperationStore` is a singleton (`DraftIntakeCompositionRegistrar.cs`). Restart or a second API replica loses intake progress. Persist advisory-draft async operations in the **tenant SQL** database (same DDL file + numbered migration). Rehydrate the Working draft workspace on load.

Idempotent create: same operation id does not duplicate work.

## Why

Week-long drafting is the livelihood object (ADR 0074). Progress that lives in process RAM is a casual evaluator.

## Context

- `DraftIntakeCompositionRegistrar.cs`
- `InMemoryAdvisoryDraftOperationStore`
- Architecture draft workspace / structured brief in-flight helpers
- ADR 0011 storage provider — SQL path is the production store

## What to build

1. SQL table in the single tenant DDL + DbUp migration; repository class in its own file.
2. DI: SQL in production-like hosts; in-memory allowed only for unit tests / explicit StorageProvider InMemory.
3. Tests: persist → new process/scope → operation still listed; replica-safe unique key.
4. UI: if operation is missing, honest recovery (not a spinner forever) — align with DR-06 language where it is a long operation.

## Acceptance criteria

- Killing the API process does not forget an in-flight advisory draft operation on SQL hosts.
- InMemory tests still run without SQL.

## Constraints

- Terraform unchanged unless a new secret appears (should not). Tenant isolation on every query.
