# ABQ-09 — Implement `-Nominate` from git churn and add missing zones

**After ABQ-08.** Do not re-split `archlucid-core`. Do not hunt.

## Goal

`.\scripts\agent\al-bug-pick-zone.ps1 -Nominate -Preview` actually exists (today the ledger documents it; the script **has no `-Nominate` parameter**). It diffs recent production churn against zone `paths` and prints **proposed ledger stanzas** for uncovered directories. You also **add** a first batch of unseeded zones for hot files that were already uncovered as of 2026-09-06.

## Why

Owner concern: lots of new functionality, not enough zones. Churn since 2026-08-20 (production, excluding tests/docs) concentrated on Architecture Intelligence orchestrator/cache, topology endpoint index, review-detail workspace, intake wizards, findings queue, resource hub, infra-evidence composition, and claim-discipline policy — several of which are absent from current zone `paths` (topology zone lists merge gate + graph merge only; architecture-intelligence zone lists recommendation engine + extraction router only).

## Context

- `scripts/agent/al-bug-pick-zone.ps1` — add `-Nominate`; keep default pick behavior unchanged
- `docs/library/AL_BUG_HUNT_LEDGER.md` § Nominate mode
- `.cursor/commands/al-bug.md` Phase 1.1a “use `-Nominate` when implicated files are outside every current zone”
- Existing zones to **extend vs new** (do not duplicate):

  | Churn hotspot | Action |
  | --- | --- |
  | `ArchLucid.Application/ArchitectureIntelligence/ClosedLoopArchitectureReasoningOrchestrator.cs` | **New** zone `architecture-intelligence-orchestrator` (orchestrator + `ReviewResultCache.cs` + `ReviewCacheManifestBuilder.cs`) — do not dump into `architecture-recommendation` |
  | `ArchLucid.Application/Runs/Orchestration/TopologyProposalRelationshipEndpointIndex.cs` | **Extend** `topology-proposal-merge` `paths` + test-filter (do not create a second topology mega-zone) |
  | `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/` | **New** `ui-review-detail-workspace` |
  | `archlucid-ui/src/app/(operator)/architecture/reviews/new/` | **New** `ui-review-intake-wizards` |
  | `GovernanceFindingsQueueClient.tsx` | **New** `ui-governance-findings-queue` |
  | `ResourceHubClient.tsx` | **New** `ui-infra-resource-hub` |
  | `ArchLucid.Host.Composition/Startup/Modules/InfraEvidenceCompositionModule.cs` | **New** `host-infra-evidence-composition` |
  | `archlucid-ui/src/lib/claim-discipline-policy.ts` | **New** `ui-claim-discipline-policy` |

  Skip generated OpenAPI `schemas.generated.ts` / `paths.generated.ts` as hunt zones.

## What to build

1. Implement `-Nominate`:
   - `git log --since` (default 30 days, or since newest `last-hunt`) `--name-only` production paths
   - Exclude `*.md`, `*Tests*`, `__tests__`, `*.generated.ts`, `package-lock.json`, `Directory.Packages.props`
   - A file is a **gap** if no zone `paths` prefix/exact match covers it (retired mega-zones with empty paths do not cover Core)
   - JSON: `nominate: true`, `gaps: [{ path, commitCount }]`, `proposedZones: [{ id, paths, impact, testFilterGuess }]`
   - Host preview prints markdown stanzas the agent can paste — **this ABQ-09 session should paste the first batch above**, not dump 200 micro-zones. Cap auto-proposals at ~15 highest-churn uncovered directories.
2. Add the named new zones as `unseeded`, hunts 0, no hunt-ready templates. `test-filter` must point at existing test names or a directory-qualified `FullyQualifiedName~` that will work once tests exist.
3. Extend `topology-proposal-merge` paths with `TopologyProposalRelationshipEndpointIndex.cs` and the edge mapper if it is still missing from `paths` but lives beside them.
4. Pester: Nominate on a fixture ledger + fake path list (inject via a `-NominatePathList` test hook or skip git with `-SkipGit` + a `-NominatePaths` parameter used only in tests — keep production API ` -Nominate`).
5. Docs: ledger § Nominate mode describes the real flag.

```powershell
Invoke-Pester -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
```

## Acceptance criteria

- `Get-Command` / script `param()` includes `Nominate`.
- `-Nominate -Preview -SkipGit` does not throw.
- Ledger contains the new unseeded UI/AI/host zones listed above (or a written reason a row already existed).
- Topology zone paths include the endpoint index.
- No new zone has `paths: ArchLucid.Core/` or `archlucid-ui/src/app/(operator)/`.

## Constraints

- Do not seed hunt-ready harm-class rows.
- Do not hunt or fix product bugs in this session.
- Do not include buyer-copy-only files (`operator-home.ts`) unless they contain logic (skip pure copy).
- Working-tree safety on ledger + picker.
