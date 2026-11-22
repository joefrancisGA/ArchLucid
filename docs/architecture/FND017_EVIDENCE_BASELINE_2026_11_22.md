# FND-017 evidence-based analyzer integration baseline (2026-11-22)

## Scope

Private repository `joefrancisGA/ArchLucid`, stacked pull requests [#7766](https://github.com/joefrancisGA/ArchLucid/pull/7766), [#7768](https://github.com/joefrancisGA/ArchLucid/pull/7768), [#7769](https://github.com/joefrancisGA/ArchLucid/pull/7769), [#7771](https://github.com/joefrancisGA/ArchLucid/pull/7771), [#7772](https://github.com/joefrancisGA/ArchLucid/pull/7772), [#7773](https://github.com/joefrancisGA/ArchLucid/pull/7773), [#7774](https://github.com/joefrancisGA/ArchLucid/pull/7774), and [#7776](https://github.com/joefrancisGA/ArchLucid/pull/7776).

## Confirmed historical CI evidence

| PR | Observed GitHub Actions workflow | Result and blocking evidence |
|---|---|---|
| #7766 | [45051541180](https://github.com/joefrancisGA/ArchLucid/actions/runs/45051541180) | Success: Python conformance scanner ran; **4 files reviewed, 2 findings** |
| #7768 | [45051740361](https://github.com/joefrancisGA/ArchLucid/actions/runs/45051740361) | Failure: RS2008 for FND017001 |
| #7769 | [45051908923](https://github.com/joefrancisGA/ArchLucid/actions/runs/45051908923) | Failure: RS2008 for FND017001 and 002 |
| #7771 | [45052010671](https://github.com/joefrancisGA/ArchLucid/actions/runs/45052010671) | Failure: RS2008 for FND017001–003 |
| #7772 | [45052870907](https://github.com/joefrancisGA/ArchLucid/actions/runs/45052870907) | Failure: RS2008 for FND017001–004; CS8602 at CFG successor access |
| #7773 | [45053015293](https://github.com/joefrancisGA/ArchLucid/actions/runs/45053015293) | Failure: RS2008 for FND017001–005; CS8602 at CFG successor access |
| #7774 | none observed on its own commit | No validated analyzer execution |
| #7776 | original [45054618197](https://github.com/joefrancisGA/ArchLucid/actions/runs/45054618197) queued when inspected | No verified analyzer test result from that queued attempt |

**No passing Roslyn analyzer suite was observed in those historical runs.** The workflow stopped at analyzer project compilation before any test results could be established.

## Distinguish Python baseline from .NET analyzers

The successful #7766 **Python** policy scanner is a separate component from the later Roslyn rules. Its `FND017-001`–`FND017-004` IDs (with hyphens) are **not** the same checks as Roslyn `FND017001`–`FND017005`. It reported four present files and two missing-file findings. Direct GitHub source lookup confirms the missing policy paths:

- `scripts/integration/fnd016_remediation_safety_controller.py`
- `scripts/integration/fnd016_recovery_stop_gate.py`

These are verified **coverage gaps/missing paths**, not proven security vulnerabilities or code defects. The Python scanner did not find a forbidden token or import in the four present files.

## Actual endpoint source-grounded baseline

Inspected `ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs` on the FND-017 branch.

- Request parameter `secureNowExchange` defaults to false; ordinary snapshot retrieval uses scoped repository calls and is not subject to the **exchange-specific** evidence authorization gate.
- Exchange mode requires a server-side feature flag before handling reads.
- First authorization binds `User`, `scope.TenantId`, `scope.WorkspaceId`, `scope.ProjectId`, `runId`, and `ct`; denial terminates with `NotFound()`.
- The anchor is loaded from `runRepository.GetByIdAsync(scope, runId, ct)`. The temporal resolver selects the latest graph run in the anchor's project.
- After rejecting `resolved.ProjectId != anchor.ProjectId`, the second authorization binds the same identity/scope and `resolved.RunId`; denial terminates before `GetRunDetailAsync(scope, resolved.RunId, ct)`.
- Exchange mode returns `Ok(exchange)`; ordinary mode returns `Ok(body)`.

The corrected `SecureNowExchangeModePattern` recognizes this narrow source shape to prevent unconditional dominance false positives. It does not prove arbitrary branching, trustworthiness of `scope`, full resource provenance, or interprocedural integrity. The new real-file regression tests assert the guarded mode pattern, exact anchor/resolved IDs and scopes, project rejection, and separate response branches.

## Current corrective commits in #7776

- Registered unshipped Roslyn rule IDs `FND017001`–`FND017005` as an `AdditionalFiles` manifest to address RS2008.
- Fixed nullable CFG successor accesses that produced CS8602.
- Switched CFG retrieval to `OperationBlockAnalysisContext.GetControlFlowGraph` so either method-body or block roots can be analyzed.
- Added real-endpoint source-grounded regression tests to the targeted workflow.

## Enforcement disposition

| Analyzer | Baseline status | Enforcement |
|---|---|---|
| FND017001 — Core dependency semantics | Prior build failed RS2008, latest tests not yet verified | Advisory |
| FND017002 — Snapshot authorization ordering | Unconditional-mode false positive addressed with conservative guarded-pattern recognition; tests not yet verified | Advisory |
| FND017003 — Authorization denial consumption | Real endpoint source matches expected denial-return shape; tests not yet verified | Advisory |
| FND017004 — CFG dominance | Prior CS8602 and operation-root handling repaired in source; current tests not yet verified | Advisory |
| FND017005 — Tenant and run binding | Real endpoint source has expected explicit arguments; tests not yet verified | Advisory |

**Observed .NET diagnostic counts on the actual API build: not available.** No diagnostic zero or pass should be inferred from source review or synthetic tests. The next evidence gate is a passing targeted test workflow followed by an analyzer-enabled build of the actual application and runtime tests for cross-tenant and denied-access paths. All rules remain advisory and no production remediation is enabled.
