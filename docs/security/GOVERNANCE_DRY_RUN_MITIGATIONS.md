# Governance dry-run mitigations (enumeration & SIEM visibility)

## Objective

Document controls added for governance **dry-run** flows so security and platform teams can reason about residual risk after `dryRun=true` skips repository writes, baseline audit rows, durable rows for real commits, and integration outbox work.

## What changed (product behavior)

| Area | Control |
|------|---------|
| **Approval request** `POST /v1/governance/approval-requests?dryRun=true` | After successful in-scope validation, the app emits **`GovernanceDryRunValidationAttempted`** (durable audit) so operators cannot probe run existence without a forensic row. |
| **Promotion** `POST /v1/governance/promotions?dryRun=true` | Same **`GovernanceDryRunValidationAttempted`** event after validation succeeds (including prod approval-chain checks). |
| **Policy-pack what-if** `POST /v1/governance/policy-packs/{id}/dry-run` | Uses rate-limit policy **`governancePolicyPackDryRun`**, partitioned by **authenticated user** (`NameIdentifier` claim fallback to identity name / IP), with a **lower default permit count** than the controller-wide `fixed` policy. |
| **Promotion validation errors (API)** | Non-Admin callers receive **opaque** `InvalidOperationException` messages for prod approval-chain mismatches; **Admin** HTTP principals still drive **`verbosePromotionValidationErrors`** so support tooling can see stored run id / manifest / status in the exception text. **Structured logs** always carry sanitized detail for operators. |

## Configuration keys

Optional overrides (validated when the section exists):

- `RateLimiting:GovernancePolicyPackDryRun:PermitLimit` (default: see `RateLimitingDefaults.GovernancePolicyPackDryRunPermitLimit`)
- `RateLimiting:GovernancePolicyPackDryRun:WindowMinutes` (default: `1`)
- `RateLimiting:GovernancePolicyPackDryRun:QueueLimit` (default: `0`)

## Data flow (audit)

```mermaid
flowchart LR
    Client["Operator_HTTP_client"]
    Api["GovernanceController"]
    Svc["GovernanceWorkflowService"]
    Audit["IAuditService_durable"]

    Client -->|"dryRun_true"| Api --> Svc
    Svc -->|"GovernanceDryRunValidationAttempted"| Audit
```

## Security / scalability / reliability / cost

- **Security:** Dry-run paths now leave **durable audit** breadcrumbs; promotion responses no longer leak stored manifest/run details to non-Admin callers (see `GovernanceWorkflowService` + controller role check).
- **Scalability:** Per-user throttling on policy-pack dry-run reduces **bulk run-id oracle** throughput without blocking unrelated `fixed`-policy traffic.
- **Reliability:** Audit uses existing **`DurableAuditLogRetry`** semantics (same family as other governance durable rows).
- **Cost:** Extra audit rows and occasional warning logs are bounded by legitimate dry-run usage; tune `PermitLimit` if log volume is a concern.

## Related code

- `ArchLucid.Core/Audit/AuditEventTypes.cs` — `GovernanceDryRunValidationAttempted`
- `ArchLucid.Application/Governance/GovernanceWorkflowService.cs` — dry-run audit + opaque promotion errors
- `ArchLucid.Api/Startup/InfrastructureExtensions.cs` — `governancePolicyPackDryRun` rate-limit policy
