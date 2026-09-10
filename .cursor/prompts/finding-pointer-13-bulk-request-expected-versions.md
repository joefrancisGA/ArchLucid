# FP-13 — Bulk HTTP request carries per-finding expected pointer tokens

Do not change SQL yet (FP-14). Do not regenerate OpenAPI until FP-16 if you can add the DTO first and snapshot in 16.

## Goal

Extend `RecordBulkFindingDispositionRequest`:

```csharp
public IReadOnlyDictionary<string, string>? ExpectedCurrentDispositionRowVersionBase64ByFindingId { get; init; }
```

(or an `IReadOnlyList` of `{ FindingId, ExpectedCurrentDispositionRowVersionBase64 }` if dictionary XML/OpenAPI is painful — pick one and use it everywhere).

Omitted map / missing finding id → treat as **null expected** for that finding (first write OK; existing pointer 409s after FP-14).

Do not add a single shared token for the whole batch.

`GovernanceStickinessFacade.Findings.Dispositions` bulk mapper (~L110–119) currently builds `RecordFindingDispositionRequest` **without** `ExpectedCurrentDispositionRowVersionBase64` even though `FindingInspectResponse` has `LatestDispositionRowVersionBase64`. **Do not** silently use the just-loaded inspect token as a substitute for the client map — that only covers an intra-request race, not a ten-minute stale queue. Copy **client-provided** map entries onto each `RecordFindingDispositionRequest`.

## Why

Bulk is a livelihood write across many findings. One shared rationale must still CAS each pointer.

## Context

- `ArchLucid.Contracts/Governance/RecordBulkFindingDispositionRequest.cs`
- Facade `RecordBulkDispositionAsync`
- Controller already returns 409 via `FindingDispositionConflictException`

## What to build

1. DTO field + XML doc.
2. Facade copies map → per-request `ExpectedCurrentDispositionRowVersionBase64`.
3. Unit test: map `"f1" → "AQID"` appears on the request passed to `IFindingDispositionService.RecordBulkAsync`.

## Acceptance criteria

- Unknown extra keys in the map are ignored (do not 400 the whole batch solely for extra keys).
- Finding in `FindingIds` with no map entry → null expected on that request.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0076 body except Related pointers. Do **not** add a new ADR. FP-22 may correct the stale PA table in `docs/library/FINDING_CONCURRENT_DISPOSITION_CONFLICT_CONTRACT.md`.
- **Do not** implement LP-19 (401 resume / idempotency replay) or LP-20. This wave only attaches the CAS token and 409 recovery.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK, LP except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- Prefer **no schema change** — `RowVersionStamp` already exists on `dbo.FindingCurrentDispositions`. SQL stays in the single DDL file per database plus a numbered migration only if a schema change is unavoidable.
