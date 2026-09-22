# SA-18 — Human asset assertions (sensitivity / criticality)

**Do not** infer PHI from resource names via LLM as ObservedFact. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

`SecurityAssetAssertion` on a `CloudResourceId`: data sensitivity, regulatory class, production vs nonproduction, business criticality, optional revenue/patient-impact flags. **ExpirationUtc required.** Expired assertions stop feeding crown-jewel ranking (consequence → Unknown) and emit an operational observation like IE-12.

## Why

A public marketing PDF store and a private patient SQL are not equivalent. Without decaying human context, either everything is crown-jewel or nothing is.

## Context

- Plane §§3, 10
- IE-12 `OperationalSecurityException` expiry pattern
- SA-01 nullable `CrownJewelAssertionId`

## What to build

1. Table + API: create/renew/revoke (ExecuteAuthority), list (Read). ProvenanceKind HumanAssertion only for the classification claim. SoD if you attach approval (approver ≠ author) — match IE-12 if cheap.
2. Engines already shipped should read assertions when present (hook or re-query). If engines shipped without hook, add a resolver `ISecurityAssetAssertionResolver` they can call in a follow-up — this prompt must at least persist + GET + expiry job/read-side.
3. Tests: expiry clears crown-jewel use; missing expiry rejected; tenant isolation; LLM ingest endpoint if any cannot set HumanAssertion (no such endpoint preferred).

## Acceptance criteria

- Exceptions (IE-12) and assertions stay different types.
- Decay is mandatory.

## Constraints

- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'`

## Done when

PHI is a decaying human claim SecureNow can cite, not a guessed tag.
