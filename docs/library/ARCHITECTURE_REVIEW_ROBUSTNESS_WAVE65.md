> **Scope:** Contributor-reference — wave-65 robustness controls for architecture create and review (branch `cursor/wave65-robustness-e14f`).

# Architecture create/review robustness — wave 65

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE64.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE64.md) (753–764 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 765 | Realized-value attestation PUT sealed guard + OpenAPI **409** | `GovernanceStickinessController.Attestation.cs`, `GovernanceStickinessFacade.Recurrence.cs` — `UpsertRealizedValueAttestationAsync` |
| 766 | Realized-value attestation PUT mutation `blockedReason` | `realized-value-attestation-mutation-blocked-reason.ts`, `use-realized-value-attestation-mutation.ts` |
| 767 | Recurrence schedule CREATE OpenAPI **409** | `GovernanceStickinessController.Schedules.cs` — `CreateRecurrenceSchedule` |
| 768 | Recurrence schedule UPDATE sealed guard + OpenAPI **409** | Same file — `UpdateRecurrenceSchedule`; `UpdateRecurrenceScheduleAsync` sealed guard |
| 769 | Recurrence schedule mutation fail-closed UX | `recurrence-schedule-mutation-blocked-reason.ts`, `use-recurrence-schedules-client.ts`, `RecurrenceScheduleCreatePanel.tsx` |
| 770 | Governance workflow mutation `blockedReason` | `governance-workflow-mutation-blocked-reason.ts`, `use-governance-workflow-mutations.ts`, `GovernanceWorkflowMutationHost.tsx` |
| 771 | Governance review context fail-closed hook | `governance-review-context-blocked-reason.ts`, `load-governance-review-context.ts`, `use-governance-review-context-query.ts`, `GovernanceReviewContextBlockedCallout.tsx` |
| 772 | Single finding disposition POST mutation `blockedReason` | `finding-keyboard-disposition-blocked-reason.ts`, `FindingKeyboardTriageHost.tsx` |
| 773 | Policy-pack simulate POST OpenAPI **409** | `PolicyPacksController.Simulate.cs` — `Simulate` / `SimulateBulk` |
| 774 | Policy-pack simulate fail-closed UX | `policy-pack-simulate-blocked-reason.ts`, `PolicyPackImpactPreviewPanel.tsx`, `use-policy-pack-visual-builder.ts` |
| 775 | Pre-commit synthetic simulation fail-closed UX | `pre-finalize-synthetic-simulation-api.ts`, `pre-finalize-synthetic-simulation-blocked-reason.ts`, `CommitRunButton.tsx` |
| 776 | Draft intake PATCH autosave sealed-manifest blocked-reason | `architecture-draft-blocked-reason.ts`, `use-architecture-draft-autosave-persist.ts` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave65ArchitectureTests.cs`.

**Hasher baseline note:** wave 65 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE66.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE66.md) (777–788).
