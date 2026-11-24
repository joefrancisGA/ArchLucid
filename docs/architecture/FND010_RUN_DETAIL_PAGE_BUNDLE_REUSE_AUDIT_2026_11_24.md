# FND-010 run-detail page bundle control reuse audit — 2026-11-24

## Baseline and verified consumer inventory

This focused architecture reuse review began from the FND-010 **draft PR #7999** head, which already consolidates manifest integrity checks into the existing application `SealedManifestReadGuard.EnsureManifestSummaryBindingAndHashesOrThrow`. At the time of inspection `master` was `09ef642a7cdd61323165bc6f55f2215eb4f0e24d`. This PR is a dependent, narrow reuse extension rather than a new policy implementation.

The existing `RunDetailPageBundleController` is class-level protected by `ReadAuthority`, uses scoped repositories, and carries a separate sealed-manifest hash helper. However, none of its three actions invokes the already registered `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync` before its first run-detail read.

| Route / action | Existing read order | Finding and reuse |
| --- | --- | --- |
| `GET /v1/authority/reviews/{runId}/critical-page-bundle` / `GetCriticalPageBundle` | Buyer run detail, potential manifest summary and artifacts, buyer enrichment, sealed helper (no-op when slim buyer detail lacks hydrated manifest) | Missing restricted-architecture share check before detail; a pinned manifest summary and descriptor fan-out were not strongly sealed/bound |
| `.../timelines-bundle` / `GetTimelinesBundle` | Full run detail, sealed hash, pipeline audit and stage timeline | Missing share check before detail/timeline |
| `.../workspace-context-bundle` / `GetWorkspaceContextBundle` | Current run detail/summary, list of project runs, prior run comparison | Missing share check before current detail, **and** another run in project may have distinct sharing permissions |

This is a **confirmed additional architecture-share control omission**, not proof that scoped repository queries leaked data across tenants. Existing `ReadAuthority` and sealed-manifest integrity are complementary controls, not substitutes for per-architecture sharing.

## Reuse implementation

1. Inject the **existing** `IArchitectureShareAccessGate` into the controller through already registered DI. Add a small private `EnsurePageBundleRunShareReadAllowedAsync(scope, runId, ct)` wrapper in the controller's existing sealed-manifest partial; it forwards authenticated `User`, trusted current scope, exact requested run ID, and cancellation token. **All three entry actions call it before any run-detail, audit, artifact, summary or compare read.** A denial returns the existing non-disclosing gate result.
2. Critical-page bundle: after the authorized buyer-detail read, if its run header indicates a pinned golden manifest, load the **scoped** summary and slim run/manifest compare detail, verify the **exact pinned manifest** via PR #7999's `SealedManifestReadGuard.EnsureManifestSummaryBindingAndHashesOrThrow` before any artifact descriptor fan-out or buyer enrichment. Missing or mismatched pin/summary/hash fails with existing HTTP 409. Uncommitted/no-golden runs keep their existing empty manifest/artifact behavior. This adds one slim compare query for pinned runs, while eliminating the prior potential integrity blind spot. It deliberately does not apply historical-manifest logic to an endpoint that always uses the current run header pin.
3. Timeline bundle: reuse the same sharing gate before full run detail and timeline query.
4. Workspace-context bundle: authorize current run before its detail. Its project-run list may include other architectures; reuse `EnsureArchitectureReadAllowedAsync` **once per distinct non-null architecture identity** (cached for this request; bounded by the existing maximum 60 projected run summaries). Drop denied project-run entries rather than reveal their IDs. The requested run remains independently authorized; unlinked legacy runs retain existing ReadAuthority+scoped-list semantics as they would through `EnsureRunReadAllowedAsync`. A prior comparison run is separately authorized through the run gate before invoking pair load/compare or returning its ID. A denied prior becomes absent rather than a run-specific error. No new sharing logic is added.

## Focused tests

New `ArchLucid.Api.Tests/RunDetailPageBundleShareAccessTests.cs` includes:
- Three strict negative tests proving denied **critical, timelines, workspace** requests call no authority query, manifest, artifact, timeline, prior compare or run repository consumer after the gate.
- Critical bundle missing pinned manifest summary or inconsistent pin returns 409 before artifact fan-out, and authorized current pinned manifest reaches artifact queries only after a matching sealed hash.
- Workspace related-run list excludes two denied runs sharing the same architecture while admitting a permitted architecture; gate is called once per distinct architecture.
- Denied prior run is removed from output and never triggers comparison access.

The FND-010 focused .NET workflow selects the new test class alongside the existing nineteen control/regression suites; PR target branch is #7999's `audit/fnd010-shared-exact-manifest-seal-20261124`. No comprehensive/full `master` build is dispatched. **Passing tests are not claimed until an actual focused workflow run succeeds.**

## Source history and boundaries

GitHub current-path commit history (not rename-follow) on `master` at audit time:

| Inspected file | Earliest visible path commit UTC | Last path modification on baseline master UTC |
| --- | --- | --- |
| `RunDetailPageBundleController.Critical.cs` | 2026-08-26 22:42:59 | 2026-09-10 19:41:10 |
| `RunDetailPageBundleController.WorkspaceContext.cs` | 2026-08-26 22:42:59 | 2026-09-11 11:41:23 |
| `RunDetailPageBundleController.Timelines.cs` | 2026-08-26 22:42:59 | 2026-09-10 19:41:10 |
| `RunDetailPageBundleController.SealedManifestGuard.cs` | 2026-09-08 22:24:44 | 2026-09-10 18:11:32 |

The oldest **source paths touched** date to 2026-08-26. Among them the oldest **last-touch** was 2026-09-10 (Critical/Timelines). This does not establish pre-rename file ancestry.

## Dependencies and non-goals

This PR depends on **#7999**, which is still a draft against master at branch creation; it calls the shared exact-manifest guard defined there. **Do not merge the dependent child before its parent**, nor use it to sidestep user-controlled merges. Once #7999 is merged, retarget to master, remove temporary workflow branch trigger, and revalidate focused CI. It changes neither the SecureNow-specific `evidence.read` entitlement nor the central share authority implementation, and creates no new architectural control family. The request-scoped per-architecture filtering costs up to one gate evaluation per distinct architecture among 60 visible candidate rows; monitor performance before considering a different batch interface. No cloud remediation, full master build, or automatic merge.
