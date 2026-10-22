# SN-QQ-01 — Question disposition store and API

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QQ-02 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

## Goal

SecureNow can store that a person answered, ignored, or reopened a question, and the next inventory snapshot for that subscription still sees that disposition.

## Why

Inference answers already persist on `OperatorInferredConnectionRecord`, keyed by snapshot. Diagram-evidence questions and pack questions have nowhere to record "don't ask again." The owner wants that memory on the subscription and the resource, so a new snapshot does not ask the same question again while the evidence is unchanged.

## Read first

- `ArchLucid.Application/InfraEvidence/OperatorInferredConnections/OperatorInferredConnectionService.cs` (`ListBySnapshotAsync` takes `scope.TenantId`)
- `ArchLucid.Api/Controllers/InfraEvidence/InfraEvidenceOperatorInferredConnectionsController.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/SecurityAssetAssertionRecord.cs` (`ExpirationUtc` is required)
- `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md`
- `docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`

## What to build

Add a disposition record and a service. Follow the operator-inferred connection layering: port and record under `ArchLucid.Core`, service under `ArchLucid.Application`, controller under `ArchLucid.Api`, one class per file.

Identity of a row, in this order:

1. Tenant, from the current scope. Never from the request body.
2. Subscription id, compared case-insensitively.
3. ARM resource id, compared case-insensitively. Empty when the question has no resource.
4. Question key. The key contains `@v` and a positive version, for example `orphan-still-needed@v1`.

Snapshot id is the snapshot of the last write. It is not part of the identity. Workspace and project are stored as metadata of the last write. They are not part of the identity.

Fields:

- Source: `InventoryEvidence`, `InferredConnection`, or `PolicyPack`.
- Scope kind: `Resource`, `ResourceGroup`, or `Subscription`.
- Status: `Open`, `Answered`, or `Ignored`.
- Answer code and answer text. Required when status is `Answered`.
- Reason. Required when status is `Ignored`. Also required when status is `Answered`.
- `ExpirationUtc`. Required for `Answered` and `Ignored`. Reject a missing value, a value in the past, and a value more than 90 days ahead. Default the API to 90 days when the client omits it.
- Evidence fingerprint. Required opaque string. This session stores it and returns it. A later session compares it.
- Actor key and `UpdatedUtc`.
- Audit entries for `Answered`, `Ignored`, `Reopened`. Each entry stores actor, time, and reason.

HTTP, on the same versioning and read-authority pattern as the operator-inferred controller:

- `GET v1/infra-evidence/snapshots/{snapshotId}/questions` returns stored dispositions for the snapshot's subscription. Include expired rows and mark them expired. Do not delete them.
- `POST` answer, ignore, and reopen. Put `questionKey` in the body, not in the path.
- Reopen sets status to `Open`, keeps the prior answer for audit, and requires a reason.
- Reject an ignore or an answer with a blank reason.
- Do not accept a status named Skip. Skip is not stored.

Load and save with `scope.TenantId`, the same way `OperatorInferredConnectionService.ListBySnapshotAsync` does. A snapshot the scope tenant does not own returns an empty list and writes nothing.

Do not add SQL row-level security.

This session does not compile questions from diagram nodes. Tests seed dispositions directly. Do not build UI.

## Tests

1. An ignore written against snapshot A is returned for snapshot B of the same subscription and resource when the question key matches.
2. The same resource id with different casing is the same row.
3. A different subscription in the same tenant does not see the row.
4. A scope tenant that does not own the snapshot gets an empty list and no write.
5. Ignore without a reason fails. Answer without a reason fails. Expiration beyond 90 days fails.
6. Reopen of an ignored row returns `Open` and keeps an audit entry with the reopen reason.
7. A question key without `@v` and a version fails validation.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the new disposition tests.
- Do not commit.
- Do not change `OperatorInferredConnectionRecord`, the questionnaire route, or the diagrams workbench.
- Do not write to customer Azure.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A disposition is found by tenant, subscription, resource id, and versioned question key on a later snapshot, and a foreign tenant cannot read or write it.
