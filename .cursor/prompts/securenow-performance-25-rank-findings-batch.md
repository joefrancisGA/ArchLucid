# SN-PERF-25 — Rank open findings in batched reads and one score write

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`RemediationPrioritizationService.RankOpenFindingsAsync` scores every open finding with one metadata read, the exception list it already loaded, one pattern-version read per distinct version, and one score write for the page of findings. It does not query once per finding.

## Why

The method already loads open findings, scoped exceptions, and active matches in three reads. `ComputeScoreAsync` then calls `ListMetadataByFindingInScopeAsync` and `HasActiveExceptionForFindingInScopeAsync` for every finding, and `TryGetVersionAsync` for every match. `UpsertScoreInScopeAsync` runs once per finding. Findings that share a pattern version repeat the same version read. The active-exception flag is already decidable from `ScopedExceptions`.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationPrioritization/RemediationPrioritizationService.cs` (`RankOpenFindingsAsync`, `ComputeScoreAsync`)
- `ArchLucid.Persistence/InfraEvidence/SqlOperationalSecurityFindingRepository.cs` (`ListMetadataByFindingInScopeAsync`)
- `ArchLucid.Persistence/InfraEvidence/SqlRemediationPrioritizationRepository.cs` (`UpsertScoreInScopeAsync`)

## What to build

1. Branch `sn-perf/25-rank-findings-batch` from current `master`.
2. Load metadata for the distinct open finding ids in one scoped read. A finding with no metadata rows still scores as it does today.
3. Decide `hasActiveException` and `compensatingControls` from the exception list already loaded in `RankOpenFindingsAsync`. Do not call `HasActiveExceptionForFindingInScopeAsync` on that path. Leave `GetExplanationAsync` on its current per-finding reads.
4. Load each distinct `(PatternId, PatternVersion)` once. Findings with no active match still score with a null automation level and no rollback.
5. Upsert the computed scores in one scoped write (a batch method, or one command that merges the set). Keep the same `TotalScore`, `BreakdownJson`, `ExplanationSummary`, and `RuleVersion`. The finding-exists guard stays: a score for a finding outside the project scope still fails.
6. Keep the returned order: total score descending, then finding id.

## Tests

1. Two open findings call the metadata read once and the score write once.
2. Two findings that share a pattern version load that version once.
3. An active exception already in the scoped list still sets the same exception flag and compensating-controls text. A second finding without an exception stays false.
4. `GetExplanationAsync` still uses its existing per-finding reads.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: metadata, versions, and scores stay inside the caller’s project scope. Do not score another tenant’s finding.
- Scalability: distinct findings and distinct pattern versions, not one round trip per finding.
- Reliability: pass `CancellationToken`. A missing in-scope finding still fails the score write.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Ranked findings match today’s scores and order, and the rank path does not query metadata, exceptions, pattern versions, or scores once per finding.
