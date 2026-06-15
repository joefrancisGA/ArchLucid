# Fix: CI run #2179 — `Governance_approval_submit_same_idempotency_key_replays_without_duplicate_request_id` body mismatch

**Run:** 27486770797 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Commit:** `b7bf442d12e0a49c587758bf1104ad7bf77a2ff4`  
**Job:** `.NET: full regression — slow shard API (SQL, Api.Tests Category=Slow)` (databaseId `81246428549`)

## Symptom

```
[xUnit.net 00:00:20.15]
  ArchLucid.Api.Tests.MutatingEndpointIdempotencyContractIntegrationTests
    .Governance_approval_submit_same_idempotency_key_replays_without_duplicate_request_id [FAIL]

  Error Message:
   Expected secondBody to be the same string, but they differ at index 176.

  at MutatingEndpointIdempotencyContractIntegrationTests.cs:line 144
```

The test POSTs to `/v1/governance/approval-requests` twice with the **same idempotency key** and
asserts the second response body equals the first (`secondBody.Should().Be(firstBody)`).

The bodies differ at byte 176 — indicating the endpoint is **not replaying a cached body** for the
second request.

## Root cause investigation

`GovernanceController.SubmitApprovalRequest` is decorated with `[IdempotencyFilter]` and calls
`ReadGovernanceIdempotencyKey(!dryRun)` to extract the key. The filter should cache the serialized
response body on first call and replay it on subsequent calls with the same key.

The fact that bodies differ at index 176 (which falls in the `approvalRequestId` or `requestedUtc`
field of the serialized `GovernanceApprovalRequest`) implies one of:

1. **Idempotency cache miss on the second request** — the filter is not matching the cached entry,
   so `workflowService.SubmitApprovalRequestAsync` runs again and creates a new
   `GovernanceApprovalRequest` with a new `ApprovalRequestId` (random GUID) and `RequestedUtc`.

2. **Cache stores the object, not the body** — the filter serializes the `GovernanceApprovalRequest`
   object a second time on replay, producing a new timestamp in `RequestedUtc`.

3. **New non-deterministic field added to the response** — a recent change to `GovernanceController`
   or `GovernanceApprovalRequest` introduced a field that changes between the first and second
   response (e.g., a request-scoped timestamp, an audit event ID, or a header reflected into the
   body).

**`GovernanceController.cs` has uncommitted local changes** — the committed version at
`b7bf442d12e0a49c587758bf1104ad7bf77a2ff4` may have introduced the regression.

## Investigation steps

1. Read `ArchLucid.Api/Controllers/Governance/GovernanceController.cs` lines 88–137
   (`SubmitApprovalRequest`). Note any changes to how the idempotency key is read
   (`ReadGovernanceIdempotencyKey`) or how the response is constructed.

2. Read `ArchLucid.Api.Tests/MutatingEndpointIdempotencyContractIntegrationTests.cs` lines 92–145
   to understand exactly what the test sends and asserts.

3. Read `ArchLucid.Api/IdempotencyFilter.cs` (or wherever `[IdempotencyFilter]` is defined). Confirm
   whether it caches the raw response body bytes or the response model. It must cache **bytes** (the
   serialized HTTP body) to guarantee replay fidelity — any object-level caching that re-serializes
   will produce a new timestamp.

4. Inspect `ArchLucid.Contracts/Governance/GovernanceApprovalRequest.cs` — `RequestedUtc` uses
   `TimeProvider.System.GetUtcNow().UtcDateTime` as its default initializer. If the IdempotencyFilter
   re-creates or re-serializes the object at replay time, `RequestedUtc` will differ.

## Fix

The filter must cache and replay the **raw serialized body bytes** for the first matched response,
not the model. If it currently caches the model (or re-executes the action):

- Change the cache to store the serialized `byte[]` or `string` body written to the response stream.
- On subsequent requests with a matching key, write the cached bytes directly to the response
  without invoking the action.

If the regression was introduced by a new field on `GovernanceApprovalRequest` that is non-
deterministic (e.g., a server-assigned audit-event ID written into the response after the fact),
either exclude that field from the idempotency comparison or set it from the cached first value.

Do **not** remove the `secondBody.Should().Be(firstBody)` assertion — exact body replay is a product
contract for governance mutation endpoints.

## Acceptance criteria

1. `Governance_approval_submit_same_idempotency_key_replays_without_duplicate_request_id` passes
   (`secondBody == firstBody` exactly).
2. The `[IdempotencyFilter]` replays the cached bytes; a second request with the same key does not
   call `workflowService.SubmitApprovalRequestAsync` a second time.
3. Other `MutatingEndpointIdempotencyContractIntegrationTests` tests continue to pass.
4. `ArchLucid.Backend.slnf` compile check passes.

## Verification (no full slow-shard run needed)

The test uses the SQL integration host. Run scoped:

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~MutatingEndpointIdempotencyContractIntegrationTests' `
    --blame-hang --blame-hang-timeout 10min
```

## Related

- `ArchLucid.Api/Controllers/Governance/GovernanceController.cs` (locally modified)
- `ArchLucid.Api.Tests/MutatingEndpointIdempotencyContractIntegrationTests.cs` lines 92–145
- `ArchLucid.Contracts/Governance/GovernanceApprovalRequest.cs`
- `.cursor/prompts/fix-idempotency-concurrency-resolution-timeout-ci.md` (sibling idempotency fix)
