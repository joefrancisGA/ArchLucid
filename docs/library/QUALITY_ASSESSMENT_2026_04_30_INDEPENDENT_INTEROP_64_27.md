> **Scope:** Independent architectural quality assessment of the ArchLucid interoperability surface (2026-04-30). Single-dimension score only. Audience: product owner and engineering leads. Not a general quality assessment, API contract, or deployment runbook.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# ArchLucid — Interoperability Quality Assessment — 64.27%

**Assessment date:** 2026-04-30  
**Method:** Independent — fresh code and doc reading; no reference to prior assessments.  
**Quality attribute:** Interoperability — the degree to which ArchLucid can exchange information with, and be used by, external systems through standard, versioned, and reliable interfaces.  
**Deferred scope excluded from scoring:** V1.1 items (Jira, Confluence, ServiceNow first-party connectors; inbound MCP server) and V2 items (Slack connector) per `docs/library/V1_DEFERRED.md`. Architecture import connectors (Structurizr, ArchiMate, Terraform state) are `[Planned]` with no named release window and do affect this score.

---

## Score: 64 / 100

---

## What earns the score

**Outbound event contracts are professional-grade.** Per-event JSON Schemas (Draft 2020-12), a machine-readable `catalog.json` with a CI sync test (`IntegrationEventCatalogSyncTests`), CloudEvents 1.0 envelope, HMAC-SHA256 signing, and an AsyncAPI 2.6 contract give external consumers a stable, testable integration surface.

**Reliability mechanics are solid.** The transactional outbox (`dbo.IntegrationEventOutbox`) enqueues events in the same SQL transaction as the domain commit, ensuring at-least-once delivery to Service Bus even across transient transport failures. Exponential backoff, dead-letter promotion, and admin retry/dead-letter endpoints are all implemented and tested.

**Standard protocol coverage is reasonable for V1.** REST (OpenAPI 3.0), SCIM 2.0 (RFC 7644) with proper bearer isolation and full CRUD, Azure Service Bus with managed identity, CloudEvents-wrapped webhooks, HMAC signing, and Entra ID / API key authentication for integrations collectively satisfy the checklist an enterprise integration team will run.

**CI/CD integration patterns are shipped.** Two working pipeline templates (GitHub Actions, Azure DevOps), a server-side ADO PR decoration path, a `.NET` API client NuGet package, and a CLI all reduce the integration surface area that a buyer must build themselves.

**Teams connector design is correct.** Webhook URL held in Key Vault (never in SQL), per-trigger opt-in matrix (`EnabledTriggersJson`), and a trigger catalog API (`GET /v1/integrations/teams/triggers`) that the UI reads rather than hard-coding — this is the right pattern.

---

## What pulls it down

**`DataConsistencyCheckCompletedV1` is in code but absent from the catalog and has no JSON Schema.** `IntegrationEventCatalogSyncTests` uses reflection to collect every constant in `IntegrationEventTypes` (except the wildcard) and asserts they all appear in the catalog. This test should be failing in CI. External consumers have no schema to validate against for this event type.

**`MapToCanonical` does not map.** Both the AsyncAPI contract and code comments explicitly state that "older persisted rows may still use legacy V1 aliases." `MapToCanonical` only trims whitespace. If the outbox replays a row written with a legacy alias, the handler dispatch dead-letters it silently. The documented backward-compatibility guarantee is not implemented.

**Inbound context connectors are skeletal.** Architecture import connectors for Structurizr DSL, ArchiMate XML, and Terraform state are all `[Planned]` with no named release window. Without them, customers must hand-author REST payloads to push architecture context before a run can begin. A system that is hard to feed data into is interoperating on one side only.

**ADO server-side PR decoration is broken for real teams.** `AzureDevOpsIntegrationOptions` holds a single static `PullRequestId`. A team with multiple active PRs gets decoration on one fixed PR or none. The PR comment itself posts two GUIDs with no findings summary — `GET /v1/compare` exists and returns rich Markdown delta, but the decorator does not call it.

**ADO PAT in config is not enforced.** The option comment says "Use Key Vault reference in production" but no startup guard exists — unlike `BillingProductionSafetyRules` which enforces the Stripe key equivalent. A plain-text PAT in production config will not fail startup, appear in the health endpoint, or emit an audit event.

**HTTP webhook delivery has no receipt surface.** Once `WebhookHmacEnvelopePoster` dispatches a POST, the outcome is logged but not queryable. Operators cannot verify delivery, see response codes, or receive alerting on sustained webhook failures without tailing logs. The outbox covers Service Bus events but HTTP webhook delivery is unobserved at the operator level.

**`trial-lifecycle-email.v1` is an internal worker dispatch event exposed in the external catalog.** Its description says "worker-side idempotency ledger." External integrators reading the catalog will attempt to subscribe to internal retry traffic that carries no semantic meaning outside the worker.

---

## Key tradeoff

The outbound event surface — Service Bus, CloudEvents, webhooks — is well-engineered for reliability and schema stability. The inbound surface — receiving architecture context from external tools — is the dominant interoperability gap. The system communicates well with the outside world but is harder to feed. That asymmetry is the core driver of the score.

---

## Eight Best Improvements

One item is **DEFERRED** (cannot be completed without owner input and scoping); a ninth improvement is listed to compensate.

---

### Improvement 1 — DEFERRED: Architecture Import Connectors (Structurizr DSL, ArchiMate XML, Terraform State)

These three are `[Planned]` with no named release window. They are the single largest interoperability gap — without them, all context ingestion requires custom REST integration by the customer. Scoping, parser library selection, and API shape decisions require owner involvement before engineering can begin.

**No cursor prompt generated. Title marked DEFERRED.**

---

### Improvement 2 — Fix `DataConsistencyCheckCompleted` Catalog and Schema Gap

The constant `com.archlucid.system.data-consistency-check.completed.v1` exists in `IntegrationEventTypes` but has no JSON Schema file and no `catalog.json` entry. `IntegrationEventCatalogSyncTests` should be failing. This is a correctness defect in the interoperability contract.

**Cursor prompt:**

```
The constant `IntegrationEventTypes.DataConsistencyCheckCompletedV1` exists but has no
JSON Schema file and no entry in `schemas/integration-events/catalog.json`.

1. Read `ArchLucid.Application/DataConsistency/DataConsistencyReconciliationHostedService.cs`
   to identify the exact payload fields published for this event type.
2. Create `schemas/integration-events/data-consistency-check-completed.v1.schema.json`
   following the same structure as the adjacent schema files (JSON Schema Draft 2020-12,
   `$schema`, `$id` set to
   `https://archlucid.dev/schemas/integration-events/data-consistency-check-completed.v1.schema.json`,
   `additionalProperties: true`, `required` array, `properties` matching all known fields).
3. Add a catalog entry to `schemas/integration-events/catalog.json` for this event type,
   matching the structure of existing entries.
4. Add a payload contract test case in
   `ArchLucid.Core.Tests/Integration/IntegrationEventPayloadContractTests.cs` following
   the pattern of the other test methods.
5. Add the schema file to the `expectedFileToEventType` dictionary in
   `IntegrationEventPayloadContractTests.Catalog_entries_match_schema_files_on_disk`.
6. If a `<Content CopyToOutputDirectory="Always">` block exists in the test csproj,
   include the new schema file so it is available at test runtime.
7. Run `IntegrationEventCatalogSyncTests` locally to confirm the test now passes.
```

---

### Improvement 3 — ADO PR Decorator: Replace Static Comment with Findings Delta

The current `PostManifestDeltaAsync` posts two GUIDs. `GET /v1/compare` exists and returns rich Markdown delta. The decorator should call it.

**Cursor prompt:**

```
In `ArchLucid.Integrations.AzureDevOps/AzureDevOpsPullRequestDecorator.cs`,
`PostManifestDeltaAsync` posts a static two-line comment containing only the run GUID
and manifest GUID. Replace the comment body as follows:

1. Add an `HttpClient` call (using the existing injected `HttpClient`) to
   `GET /v1/compare?fromRunId=<previousRunId>&toRunId=<runId>` to retrieve the Markdown
   delta. The previous run ID is not currently in `AuthorityRunCompletedPayload` — extend
   that record to include `PreviousRunId` (nullable Guid), and emit it from the authority
   pipeline if a prior committed run exists for the same tenant/workspace/project scope.
2. If the compare endpoint returns 404 (no prior run), post the current run summary only
   (finding count by severity, run deep-link URL built from the run ID).
3. If compare returns the Markdown body, use that as the PR thread content.
4. The deep-link URL should be constructed from `AzureDevOpsIntegrationOptions.StatusTargetUrl`
   as the base, or omitted if empty.
5. Add a unit test in `ArchLucid.Integrations.AzureDevOps.Tests` that mocks the compare
   response and asserts the PR thread body contains the Markdown delta content and the
   run deep-link URL.
6. House style: primary constructor, guard clauses same-line, no trailing else,
   expression-bodied members where applicable.
```

---

### Improvement 4 — `MapToCanonical`: Implement Actual Legacy Alias Resolution

Currently only trims. The backward-compatibility guarantee for outbox replay of old rows is documented but not implemented.

**Cursor prompt:**

```
In `ArchLucid.Core/Integration/IntegrationEventTypes.cs`:

1. Search git history for any prior values of the constants in `IntegrationEventTypes`
   that differ from the current canonical `com.archlucid.*` strings. Record each alias found.
2. Add a private static readonly dictionary `_aliases` mapping each legacy alias to its
   current canonical string (use `StringComparer.OrdinalIgnoreCase`).
3. Update `MapToCanonical` to perform alias lookup after trimming:

   public static string MapToCanonical(string eventType)
   {
       if (string.IsNullOrWhiteSpace(eventType)) return string.Empty;
       string trimmed = eventType.Trim();
       return _aliases.TryGetValue(trimmed, out string? canonical) ? canonical : trimmed;
   }

4. Ensure `AzureServiceBusIntegrationEventConsumer` (or wherever handler dispatch occurs)
   calls `MapToCanonical` on the incoming `event_type` application property before lookup.
5. Add a comment block at the top of the alias dictionary: "Legacy alias entries must
   never be removed — they allow outbox replay of rows written before type string
   migrations."
6. Add unit tests in `IntegrationEventTypesTests.cs` covering each alias, the no-alias
   (canonical input) case, and whitespace trimming.
```

---

### Improvement 5 — ADO PAT Startup Safety Guard

A plain-text PAT in production config has no enforcement, unlike the Stripe key guard.

**Cursor prompt:**

```
Add a production startup safety guard for the Azure DevOps PAT. Read
`ArchLucid.Host.Core/Startup/Validation/Rules/ProductionSafetyRules.cs` first to
understand the existing pattern, then add a rule:

When `ASPNETCORE_ENVIRONMENT` is `Production` AND `AzureDevOps:Enabled` is `true` AND
`AzureDevOps:PersonalAccessToken` is a non-empty string that does NOT start with
`@Microsoft.KeyVault` (the App Service / Container Apps Key Vault reference syntax),
fail startup with:
"AzureDevOps:PersonalAccessToken must use a Key Vault reference in Production
(format: @Microsoft.KeyVault(...)). Raw PATs are not permitted in production config."

Register the guard in the same DI composition step as the existing billing guards.

Add unit tests covering: (a) enabled + production + raw PAT → fails; (b) enabled +
production + KV reference → passes; (c) enabled + development + raw PAT → passes;
(d) disabled + production + raw PAT → passes.
```

---

### Improvement 6 — Mark `trial-lifecycle-email.v1` as Internal in Catalog

This event is a worker dispatch mechanism, not an external integration surface.

**Cursor prompt:**

```
`com.archlucid.notifications.trial-lifecycle-email.v1` in
`schemas/integration-events/catalog.json` is an internal worker dispatch event, not an
external consumer surface (its description says "worker-side idempotency ledger").

1. Add `"internal": true` to its catalog entry.
2. Add `"audience": "external"` to every other catalog entry to make the distinction
   machine-readable.
3. Update `IntegrationEventCatalogSyncTests` to assert that entries with `"internal": true`
   are not listed in the external consumer table in
   `docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md`.
4. Update `docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md` § Event catalog to remove
   the trial-lifecycle-email row from the external table, adding a footnote:
   "This event is internal. External consumers should not subscribe to it."

Note: do not delete the schema file or the catalog entry — full removal is gated on
owner confirmation that no external consumer subscribes to this event type
(see Pending Questions).
```

---

### Improvement 7 — HTTP Webhook Delivery Observability

HTTP webhook delivery is fire-and-forget with no receipt, no metrics, and no operator visibility.

**Cursor prompt:**

```
In `ArchLucid.Host.Core/Services/Delivery/HttpWebhookPoster.cs` (or
`WebhookHmacEnvelopePoster.cs` if that is the outermost class):

After each HTTP POST attempt (success or failure) emit a structured log event containing
ONLY — no URL path, no body, no shared secret:

  - archlucid.webhook.status_code (int, nullable on exception)
  - archlucid.webhook.duration_ms (long)
  - archlucid.webhook.target_authority (Uri.GetLeftPart(UriPartial.Authority) only)
  - archlucid.webhook.event_type (string)
  - archlucid.webhook.tenant_id (Guid)
  - archlucid.webhook.succeeded (bool)

Also add OTel counters via `System.Diagnostics.Metrics` (or the existing
`ArchLucidInstrumentation` surface if one exists):
  - `archlucid.webhook.deliveries` (counter, tags: event_type, succeeded=true|false)
  - `archlucid.webhook.delivery_duration` (histogram, ms, tag: event_type)

Add a unit test verifying the log event is emitted with correct fields on both success
and non-2xx response. Do not break existing `WebhookPosterTests`.
```

---

### Improvement 8 — Outbox Priority: Alerts Before Internal Events

`alert.fired` and `alert.resolved` events queue behind `trial-lifecycle-email.v1` internal events with no priority ordering.

**Cursor prompt:**

```
In `ArchLucid.Persistence.Integration/DapperIntegrationEventOutboxRepository.cs`,
`DequeuePendingAsync`:

Replace `ORDER BY CreatedUtc ASC` with a priority-aware ordering. Define a static helper
`IntegrationEventOutboxPriority` in `ArchLucid.Core.Integration` that returns 0 (critical),
1 (standard), or 2 (internal) for a given event type string:

  Priority 0: com.archlucid.alert.fired, com.archlucid.alert.resolved,
              com.archlucid.compliance.drift.escalated
  Priority 1: com.archlucid.authority.run.completed,
              com.archlucid.governance.approval.submitted,
              com.archlucid.governance.promotion.activated, and remaining external types
  Priority 2: com.archlucid.notifications.trial-lifecycle-email.v1 and other internal types

Add a nullable INT `Priority` column to `dbo.IntegrationEventOutbox` in a new migration
(additive, no backfill required — default to 1 at dequeue for NULL rows). Populate it at
enqueue time from the priority helper. Use `ORDER BY ISNULL(Priority, 1) ASC, CreatedUtc ASC`
in the dequeue SQL.

Update `InMemoryIntegrationEventOutboxRepository` to sort by the same priority logic.
Add a unit test asserting that an `alert.fired` enqueued after a `trial-lifecycle-email.v1`
is returned first in the batch.
```

---

### Improvement 9 — SCIM PATCH Complex Attribute Selector Support

Microsoft Entra ID sends `members[value eq "{userId}"].active` style PATCH operations for group member deprovisioning. The current implementation returns 400 `invalidPath` for any complex selector, breaking the most common enterprise SCIM automation pattern.

**Cursor prompt:**

```
In the SCIM PATCH path parser (read the existing implementation under
`ArchLucid.Core/Scim/Filtering/` and `ArchLucid.Application/Scim/` first):

RFC 7644 §3.5.2 defines `valuePath`: `attrPath "[" valFilter "]" ["." subAttr]`.
Currently any complex selector returns 400 `invalidPath`.

1. Extend the PATCH path parser to handle the `valuePath` grammar.
2. For `members[value eq "{id}"]` style paths: extract the `value` from the filter and
   apply the operation (remove, or replace `.active`) to the matching member only.
3. Return 400 `invalidPath` only for expressions that fail to parse per the RFC grammar.
4. Return 501 `notImplemented` (RFC 7644 §3.12) for valid complex selectors targeting
   attributes not yet implemented — not 400.
5. Add unit tests: complex selector on supported attribute → 200; invalid filter
   expression → 400; valid but unsupported attribute path → 501.
6. Update `docs/integrations/SCIM_PROVISIONING.md` to remove the statement that complex
   attribute selectors return 400 and replace with a note on supported patterns.
```

---

## Pending Questions for Owner

**PQ-INTEROP-01** *(Improvement 6 — Internal Event Catalog)*: Before moving `trial-lifecycle-email.v1` to internal-only, confirm whether any Logic App, customer worker, or external consumer intentionally subscribes to `com.archlucid.notifications.trial-lifecycle-email.v1`. If yes, a deprecation window is required before marking it internal.

**PQ-INTEROP-02** *(Improvement 7 — Webhook Delivery Log)*: Should webhook HTTP delivery attempt history surface in the existing `GET /admin/integration-outbox/dead-letters` admin UI, or as a separate `GET /v1/webhooks/delivery-log` endpoint scoped per tenant?

**PQ-INTEROP-03** *(Improvement 5 — ADO PAT Guard)*: Should the PAT plaintext guard apply to `Staging` in addition to `Production`, or `Production` only?
