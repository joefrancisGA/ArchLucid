> **Scope:** Contributor-reference — CodeQL triage (ArchLucid) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# CodeQL triage (ArchLucid)

Short guide for **security-and-quality** (or **javascript-typescript-security-and-quality**) workflows. Use this when alerts look like noise after mitigations are in place.

---

## Log entries created from user input (CWE-117)

### True positives

Treat as a **real issue** when an **`ILogger`** call logs a **`string`-typed** parameter that comes from untrusted HTTP surface area, for example:

- **`[FromBody]`** DTO string properties  
- **`[FromQuery]`** / **`[FromHeader]`** string parameters  
- **`HttpContext.Request.Path`** (or **`.Path.Value`**) and similar raw path strings  

**Fix:** pass the value through **`LogSanitizer.Sanitize()`** from **`ArchLucid.Core.Diagnostics`** before logging. See **`docs/SECURITY.md`** (Log injection / CWE-117).

### CodeQL model pack (`cs/log-forging` and `LogSanitizer`)

Built-in **`cs/log-forging`** does not know your custom sanitizer unless you model it. This repo ships a **CodeQL model pack** that registers **`LogSanitizer.Sanitize`** as a **`log-injection`** barrier (aligned with **`LogForgingQuery`**’s **`barrierNode(..., "log-injection")`** in upstream CodeQL).

- **Pack:** `.github/codeql/archlucid-csharp-log-sanitizer-models/` (`qlpack.yml` + `models/*.yml`)
- **Workflow wiring:** `.github/codeql/codeql-config.yml` lists that pack under **`packs.csharp`**; **`.github/workflows/codeql.yml`** passes **`config-file`** only on the **csharp** job’s **`init`** step (the JavaScript job is unchanged).

After this is merged, **`LogSanitizer.Sanitize(...)`** call sites should stop alerting as unsanitized user input. **`models/integration-event-logging-barrier.model.yml`** extends the same pack for **`cs/exposure-of-sensitive-information`** on **`IntegrationEventTypes`** URNs and **`SanitizedLogger*`** operational-key helpers (TB-611). If an alert remains, check the sink is actually the sanitizer’s **return value** (not a raw parameter) and that the method signature still matches **`(System.String)`** in the model file.

**Copilot Autofix** for CodeQL cannot infer custom sanitizers; use this model pack (or dismiss manually with rationale).

### `LoggerExtensions.LogWarning(ILogger, Exception?, string?, params object?[])` (boxing)

Some **`cs/log-forging`** findings persist even when the template argument is **`LogSanitizer.Sanitize(...)`** at the call site: the sanitizer’s return value is boxed into **`params object?[]`**, and the query may not treat the custom barrier as effective across that hop. The same applies to **`LogInformation`** and other **`LoggerExtensions`** methods that take **`params object?[]`**.

**Mitigation in this repo:** use **`ArchLucid.Core.Diagnostics.SanitizedLoggerWarningExtensions.LogWarningWithSanitizedUserArg`**, which sanitizes immediately before the **`LogWarning`** call. A **`// codeql[cs/log-forging]`** suppression on the sink (inside Core) documents the remaining false positive for exception context + **`params object?[]`** at the helper boundary.

For **multi-placeholder `LogInformation`** in **`ArchLucid.Application`**, **`ArchLucid.AgentRuntime`**, or **`ArchLucid.Host.Core`** (no reference to **`ArchLucid.Api`**), use **`ArchLucid.Core.Diagnostics.SanitizedLoggerInformationExtensions`** (**`LogInformationArchitectureRunCommitted`**, **`LogInformationCommitRunIdempotentReturn`**, **`LogInformationGovernanceManifestPromoted`**, **`LogInformationGovernanceEnvironmentActivated`**, **`LogInformationComparisonReplaySucceeded`**, **`LogInformationAgentExecutionBatchStarting`**, **`LogInformationAgentExecutionBatchCompleted`**, **`LogInformationAgentResultSubmitted`** (coordinator **`ArchitectureApplicationService`** agent-result success log), **`LogInformationCreatingArchitectureRun`**, or add a sibling method there) so sanitization sits adjacent to the sink inside Core. **All Information helpers in this class now delegate to a private `[LoggerMessage]`-generated emitter** (declared in **`SanitizedLoggerInformationExtensions.LoggerMessage.cs`**, EventId range **3001–3009**); the source generator emits cached, strongly-typed `Action<ILogger, T1, …>` delegates (or — for the 8-parameter `EmitComparisonReplaySucceeded` — a typed `__EmitComparisonReplaySucceededStruct` `IReadOnlyList<KeyValuePair<string, object?>>` state). That removes the **`params object?[]`** boxing entirely, so the **`LogSanitizer.Sanitize`** barrier registered in **`.github/codeql/archlucid-csharp-log-sanitizer-models`** propagates straight to the **`ILogger.Log<TState>`** sink and **no `// codeql[cs/log-forging]` annotation is required on these helpers**. Adding new sibling helpers should follow the same pattern (public sanitizing wrapper → private `[LoggerMessage]` partial emitter; do **not** call `LogInformation(template, params object?[])` directly). For **`LogDebug`** with the same boxing issue, use **`SanitizedLoggerDebugExtensions`** (**`LogDebugAgentTaskFinished`**, **`LogDebugCuratedEvidenceProposalSkipped`**, **`LogDebugReferenceCaseEvaluationFailed`**); all three delegate to **`[LoggerMessage]`** emitters in **`SanitizedLoggerDebugExtensions.LoggerMessage.cs`** (EventId range **3101–3103**), so **no `// codeql[cs/log-forging]` annotation is required** at call sites. For SQL **host leader election** telemetry (lease name + instance id), use **`SanitizedLoggerHostLeaderElectionExtensions`** so **`cs/exposure-of-sensitive-information`** and **`cs/log-forging`** noise stays centralized. For **two string placeholders at `LogWarning`**, use **`SanitizedLoggerWarningExtensions.LogWarningWithTwoSanitizedUserStrings`**; for **three** (e.g. coordination validation: request id, system name, joined errors), use **`LogWarningWithThreeSanitizedUserStrings`** (same wrapper pattern). For **comparison replay failure** (`Exception` + record id + message + boolean flags), use **`SanitizedLoggerWarningExtensions.LogWarningComparisonReplayFailed`** so sanitized strings sit next to the sink (avoids **`cs/log-forging`** false positives on **`params object?[]`** boxing and on boolean placeholders). For **`LogError`** with **`Exception`** + HTTP method and path (e.g. **`WorkerHostPipelineExtensions`** unhandled exception handler), use **`SanitizedLoggerErrorExtensions.LogErrorUnhandledWorkerHttpRequest`**. If CodeQL still alerts after **`LogSanitizer.Sanitize`** on a direct **`LogInformation`** / **`LogWarning`** call that has not yet been migrated to **`[LoggerMessage]`**, add **`// codeql[cs/log-forging]`** on the **same line as the sink** (for a multi-line **`LogInformation`** / **`LogWarning`** call, typically the line with the closing **`);`**). A comment only above the opening **`_logger.Log…(`** line is often **not** picked up. The preferred remediation, however, is to migrate the helper to the `[LoggerMessage]` pattern as **`SanitizedLoggerInformationExtensions`** does, which removes the boxing entirely and eliminates the need for an inline suppression.

**Concrete:** both idempotent commit return paths in **`ArchitectureRunCommitOrchestrator`** (**`TryReturnCommittedManifestAsync`** and **`TryReturnPersistedCommitIfExistsAsync`**) must call **`LogInformationCommitRunIdempotentReturn`** — not **`_logger.LogInformation(..., LogSanitizer.Sanitize(runId), …)`** — or **`cs/log-forging`** will likely return (params boxing breaks the custom sanitizer model).

### False positives

Treat as a **false positive** when the logged parameter is a **value type** bound from **`[FromRoute]`** (or otherwise not arbitrary attacker-controlled string content), e.g. **`Guid`**, **`int`**, **`DateTime`**. Their formatted output does not carry the same newline/control-character injection risk as arbitrary strings.

**Dismiss in the GitHub CodeQL / code scanning UI** with a reason along the lines of:

> False positive — value type cannot contain control characters.

(Adjust the note if the query specifically references `ToString()` on a value type.)

### Known alerts to triage (run / approval identifiers)

**Value-type binding (typical false positive for CWE-117):**

| Location | What is logged | Parameter type in code |
| -------- | -------------- | ------------------------ |
| **`ArchLucid.Api/Controllers/Planning/ExplanationController.cs`** | **`runId`** in provenance / explanation warnings | **`Guid`** with route template **`{runId:guid}`** |

Dismiss with: *False positive — value type cannot contain control characters* (or your org’s equivalent).

**`string` route parameters:**

Several endpoints bind identifiers as **`[FromRoute] string`** (not **`Guid`**) even when values are semantically UUIDs. Controllers should log those strings only as **`LogSanitizer.Sanitize(...)`**; the **model pack** above should clear **`cs/log-forging`** for those call sites.

| Location | What is logged | Parameter type in code |
| -------- | -------------- | ------------------------ |
| **`ArchLucid.Api/Controllers/Authority/RunsController.cs`** | **`runId`** in execute / replay / determinism / commit / detail paths | **`[FromRoute] string runId`** |
| **`ArchLucid.Api/Controllers/Authority/AnalysisReportsController.cs`** | **`runId`** in analysis / export logs | **`[FromRoute] string runId`** |
| **`ArchLucid.Api/Controllers/Governance/GovernanceController.cs`** | **`approvalRequestId`** in approve / reject logs | **`[FromRoute] string approvalRequestId`** |

If CodeQL still flags a line after **`LogSanitizer.Sanitize`**, verify the extension pack is loaded (see workflow **`config-file`**), route **`LogWarning`** + user string through **`LogWarningWithSanitizedUserArg`** (see § boxing above), or refactor to **`Guid`** + **`{param:guid}`** and dismiss value-type cases per above.

### Operational keys and `cs/exposure-of-sensitive-information`

**`cs/exposure-of-sensitive-information`** may treat well-known **coordinator lease strings** (for example **`HostElectionLeaseNames.TrialLifecycleEmailPolling`**) or **`IntegrationEventTypes`** canonical URNs (for example **`TrialLifecycleEmailV1`**) as private when they flow into **`ILogger`**, even though they are **stable operational keys** (not passwords, tokens, or PII).

**Mitigation:** route lease/instance logs through **`SanitizedLoggerHostLeaderElectionExtensions`** and integration-event publish logs through **`SanitizedLoggerWarningExtensions`** (sanitization inside Core). Integration-event helpers delegate to private **`[LoggerMessage]`** emitters in **`SanitizedLoggerWarningExtensions.LoggerMessage.cs`** (EventId range **3201–3204**) so sanitized event-type strings reach **`ILogger`** without **`params object?[]`** boxing. The model pack registers **`SanitizedLogger*`** helpers as **`neutralModel`** rows with **`kind: summary`** and **`IntegrationEventTypes`** const literals with **`kind: source`** in **`models/integration-event-logging-barrier.model.yml`** (TB-611). **`LogSanitizer.EmailDomainForLogs`** is registered in **`models/log-sanitizer-barrier.model.yml`** as a **`barrierModel`** for **`file-content-store`** (TB-610). CI runs **`scripts/ci/validate_codeql_mad_kinds.py`** so invalid MaD **`kind`** literals fail the workflow instead of silently no-oping.

| Location | Notes |
| -------- | ----- |
| **`ArchLucid.Host.Core/Hosted/HostLeaderElectionCoordinator.cs`** | Use **`SanitizedLoggerHostLeaderElectionExtensions`** at call sites. Model pack covers operational lease keys; dismiss only if CodeQL still anchors at the caller after verifying **`config-file`** loads the pack. |
| **`ArchLucid.Host.Core/Integration/AzureServiceBusIntegrationEventPublisher.cs`** | **`eventType`** flows from **`IntegrationEventTypes`** canonical URNs (e.g. **`TrialLifecycleEmailV1`** = `com.archlucid.notifications.trial-lifecycle-email.v1`). Sanitized inside **`LogWarningIntegrationEventServiceBusPublishFailed`**; model pack should clear caller-line alerts. Dismiss with: *canonical integration event URN taxonomy, sanitized; not credentials or PII*. |
| **`ArchLucid.Core/Persistence/ApplicationPorts/IntegrationOutbox/OutboxAwareIntegrationEventPublishing.cs`** | Serialization / outbox enqueue failures call **`LogWarningIntegrationEventSerializationFailed`** / **`LogWarningIntegrationEventOutboxEnqueueFailed`** — same model-pack posture as Service Bus publish. |
| **`ArchLucid.Application/Tenancy/TrialTenantBootstrapService.cs`** | Email verification policy block logs through **`SanitizedLoggerTrialBootstrapExtensions.LogInformationTrialBootstrapEmailVerificationBlocked`** (domain only via **`LogSanitizer.EmailDomainForLogs`**, **`[LoggerMessage]`** emitter **3016**). Static helper keeps exposure alerts off the Application call site. |
| **`ArchLucid.Core/Costing/AwsPublicPricingClient.cs`** | HTTP probe failures use **`SanitizedLoggerDebugExtensions.LogDebugAwsPricingProbeFailed`** (region + instance type sanitized; exception forwarded for structured telemetry only). Dismiss only if CodeQL still flags after model pack + helper migration. |

### Active suppressions (2026-08-26 WK-03 / WK-03b)

Two placement rules, both learned the hard way — each mistake cost a full CodeQL run to discover.

1. **Anchor on the reported line.** The first WK-03 pass annotated the enclosing method, so
   `assert_codeql_sarif_clean.py` reported 4 unresolved findings on run
   [33024730786](https://github.com/joefrancisGA/ArchLucid/actions/runs/33024730786). Take the line
   number from the SARIF gate output, not the line that reads best.
2. **`// codeql[rule-id]` must be the line immediately above the alert, on its own.** A multi-line
   justification comment does **not** work: the adjacent line becomes prose and the directive no
   longer binds. Run [33026460733](https://github.com/joefrancisGA/ArchLucid/actions/runs/33026460733)
   still reported all 4 findings, with line numbers shifted by exactly the number of comment lines
   inserted — proof the alerts had not moved and the directive was simply too far away. Put the
   prose first and the bare directive last.

```csharp
// Why this is a false positive, in as many lines as needed.
// codeql[cs/insecure-sql-connection]
SqlConnectionStringBuilder builder = new(connectionString);
```

| Rule | Anchor line | Why | Date |
| ---- | ---- | --- | ---- |
| `cs/insecure-sql-connection` | `SqlConnectionStringCommandTimeout.Apply` — `SqlConnectionStringBuilder` construction | No connection is opened; the returned string always passes through `SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory`, which forces `Encrypt=True`. | 2026-08-26 |
| `cs/insecure-sql-connection` | `SqlConnectionStringMasterCatalog.RedirectToMaster` — `SqlConnectionStringBuilder` construction | Same as above. | 2026-08-26 |
| `cs/insecure-sql-connection` | `SqlConnectionStringMasterCatalog.ReadInitialCatalog` | Parses `InitialCatalog` only; no connection opened. | 2026-08-26 |
| `cs/user-controlled-bypass` | `RunProvenanceQueryService.GetRunTracesAsync` — `if (pageNumber < 1)` | Pagination input validation, not an authorization decision; tenant scoping and run authorization are separate. | 2026-08-26 |
| `cs/user-controlled-bypass` | `ClosedLoopArchitectureReasoningOrchestrator.LiveReview` — `&& effectiveRequest.PublishToProduct` | `PublishToProduct` is a publish **request** flag; the authorization decision is `publishDecision.PublishBlocked`, evaluated first. | 2026-08-26 |
| `js/clear-text-storage-of-sensitive-data` | `resolve-continue-last-api-key-credential.ts` | `localStorage` stores credential **slot** enum (`Admin` / `ReadOnly`), not API key secrets. | 2026-08-26 |

---

## Related documents

- [`SECURITY.md`](contributor-reference/SECURITY.md) — CWE-117 policy and **`LogSanitizer`** usage  
- [`.github/workflows/codeql.yml`](../../.github/workflows/codeql.yml) — CodeQL workflow configuration  
- [`CODEQL_MERGE_AND_LOCAL.md`](CODEQL_MERGE_AND_LOCAL.md) — Branch protection, SARIF merge gate, local CLI parity  
- [`scripts/ci/validate_codeql_mad_kinds.py`](../../scripts/ci/validate_codeql_mad_kinds.py) — MaD **`kind`** literal guard for the C# model pack
