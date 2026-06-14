# Risk & Tradeoffs — Step 8: API Routes and OpenAPI

## Context

Expose the `RiskSnapshot` through the ArchLucid HTTP API, following the
conventions in `docs/library/API_CONTRACTS.md` and the existing controller
patterns (see `GovernanceController.cs`).

Prerequisites: Steps 1–7 must be complete. Run `npm run generate:api-types` in
`archlucid-ui/` after this step to regenerate the TypeScript client.

## Routes

### GET /api/v1/reviews/{reviewRunId}/risk

Returns the `RiskSnapshot` for a review run.

Response body:
```json
{
  "snapshotId": "...",
  "reviewRunId": "...",
  "createdAt": "...",
  "tradeoffs": [
    {
      "tradeoffId": "...",
      "status": "Conflicting",          // "Conflicting" | "Unacknowledged" | "Acknowledged"
      "gainedPillar": "Cost",
      "sacrificedPillar": "Reliability",
      "mechanism": "Single region to reduce cost",
      "mechanismKey": "cost-reliability/single-region",
      "conflictingRequirementId": "req-001",
      "consequence": "High",
      "reversibility": "Costly",
      "counterfactualKey": "reliability-cost/multi-region",
      "explanationArchitect": "...",     // LLM-generated, architect rendering
      "explanationExecutive": "...",     // LLM-generated, consequence rendering
      "counterfactualStatement": "...",  // closed-form catalog-grounded option
      "evidenceNodeIds": [],
      "evidenceFindingIds": []
    }
  ],
  "requirementSmells": [
    {
      "requirementId": "req-002",
      "kind": "RoundNumber",
      "rationale": "This requirement appears to use a round number with no recorded justification — confirm before we hold your design to it.",
      "evidenceRefs": []
    }
  ],
  "concerns": [
    {
      "concernId": "...",
      "statement": "...",
      "source": "ExecutionCredibility",
      "consequence": "High",
      "reversibility": "OneWayDoor",
      "relatedFactRefs": []
    }
  ],
  "executionContext": [
    {
      "itemKey": "exec.sponsor",
      "elicitationQuestionKey": "exec.sponsor",
      "disclosure": "Undisclosed"
    }
  ]
}
```

Ordering of `tradeoffs`: Conflicting first, then by consequence desc, then
reversibility asc (mirrors §1.2).

### POST /api/v1/reviews/{reviewRunId}/risk/behavior-change

Logs a behavior-change event (leading commercial metric).

Request body:
```json
{
  "itemId": "...",
  "actionTaken": "ChangeRequirement"   // "ChangeRequirement" | "AcceptCounterfactual" | "ManifestRevision"
}
```

Returns `204 No Content`.

### POST /api/v1/reviews/{reviewRunId}/risk/outcome

Logs an outcome-capture event on an ignored finding (lagging validity metric).

Request body:
```json
{
  "itemId": "...",
  "outcomeVerdict": "ConfirmedCorrect",   // "ConfirmedCorrect" | "ConfirmedIncorrect" | "Inconclusive"
  "notes": "..."
}
```

Returns `204 No Content`.

### POST /api/v1/reviews/{reviewRunId}/risk/smells/{requirementId}/disposition

Records a requirement smell disposition ("raised once" guarantee).

Request body:
```json
{
  "verdict": "Accepted"    // "Accepted" | "Dismissed"
}
```

Returns `204 No Content`. After this call, the smell is never re-raised for this
`requirementId` + tenant.

### GET /api/v1/reviews/{reviewRunId}/risk/compare?baseSnapshotId={id}

Returns a delta between the current snapshot and a prior snapshot. Reuse the
existing `/compare` pattern if one exists.

## Controller

`ArchLucid.Api/Controllers/Risk/RiskController.cs`

- Decorate with `[ApiController]`, `[ApiVersion("1.0")]`, `[Route("api/v1")]`.
- Require `[Authorize]` and `[RequiresCommercialTenantTier]` on all actions
  (this is an Enterprise/Governance tier feature).
- Inject `RiskSnapshotService`, `IRiskBehaviorChangeEventRepository`,
  `IRiskOutcomeCaptureRepository`, `IRequirementSmellDispositionRepository`.
- All tenant isolation via `ScopeContext` (follow the existing pattern).

## OpenAPI

- All request/response types must produce correct OpenAPI schema entries.
- Run `dotnet build` and verify the OpenAPI snapshot reflects the new routes.
- Update `docs/library/API_CONTRACTS.md` with the new surface summary.

## Non-goals (do not implement)

- No risk register endpoint.
- No numeric score or probability fields in any response DTO.
- No "all risks for tenant" aggregate endpoint (snapshot-per-run only).
- No mutable risk lifecycle endpoint (disposition only, append-only).

## Acceptance criteria

- All 5 routes return correct status codes against a test `RiskSnapshot`.
- `[RequiresCommercialTenantTier]` blocks non-enterprise tenants.
- `POST .../behavior-change` and `POST .../outcome` write to separate tables
  (verified by integration test or repository test).
- OpenAPI snapshot updated and `npm run generate:api-types` produces valid types.
