# SA-15 — Organizational routing on paths

**Do not** invent owners with AI. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Attach routing fields to a path finding: business owner, technical owner, security owner, remediator, verification owner, required approvals. Empty is InsufficientEvidence for “who moves the org,” not a guessed Entra display name.

## Why

A security architect has to move the organization. Scanner tickets without owners die. Invented owners are worse than none.

## Context

- Plane §8
- IE-12 exception owners (pattern)
- `OperationalSecurityFindingMetadataRecord` or a dedicated table
- No CMDB collector in this prompt

## What to build

1. `SecurityEvidencePathRouting` table: PathId/FindingId, role enum, principal id **or** display string from **HumanAssertion** / existing tag keys you document (`owner`, `application`, `costCenter`) as DerivedFact when tags exist.
2. Tag mapping documented; missing tags → empty + reason `no-owner-tag`.
3. GET path includes routing array.
4. Tests: tag `owner=platform@contoso` → DerivedFact routing; no tag → empty not “unknown-admin”; AI cannot POST ObservedFact owners (reject ProvenanceKind ObservedFact on this table unless you only allow HumanAssertion/DerivedFact).

## Acceptance criteria

- SoD: do not auto-set remediator = approver.

## Constraints

- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'`

## Done when

Path GET can show owners when tags/assertions exist and stays silent otherwise.
