> **Scope:** Contributor-reference — wave-120 robustness controls for architecture create and review (branch `cursor/wave120-robustness-e14f`).

# Architecture create/review robustness — wave 120

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE119.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE119.md) (1413–1424 carryover).

| # | Control | Primary wiring |
|---|---------|----------------|
| 1425 | Sponsor review packet GET runtime **409** mapper | `PilotsController.Packs.cs` — `GetExecutiveReviewPacket` |
| 1426 | Sponsor proof pack ZIP GET runtime **409** mapper | same file — `GetSponsorProofPackZip` |
| 1427 | First-value report GET runtime **409** mapper | same file — `GetFirstValueReport` |
| 1428 | First-value report PDF POST runtime **409** mapper | same file — `PostFirstValueReportPdf` |
| 1429 | Sponsor one-pager POST runtime **409** mapper | same file — `PostSponsorOnePager` |
| 1430 | Sponsor pack sent POST runtime **409** mapper | same file — `PostSponsorPackSent` |
| 1431 | Sponsor preliminary share POST runtime **409** mapper | same file — `PostSponsorPreliminaryShare` |
| 1432 | Pilots sealed guard runtime **409** mapper | `PilotsController.SealedManifestGuard.cs` — `EnsureRunSealedManifestReadAllowedAsync` |
| 1433 | Pilots collateral programmatic download `blockedReason` | `pilots-collateral-download-api.ts`, `pilots-collateral-mutation-blocked-reason.ts` |
| 1434 | First-value PDF + sponsor pack-sent client `blockedReason` | `downloads-blob-trigger-reports.ts`, `downloads-export-jobs.ts`, blocked-reason helpers |
| 1435 | Sponsor banner programmatic export fail-closed UX | `EmailRunToSponsorExportActions.tsx`, `use-email-run-to-sponsor-banner.ts` |
| 1436 | Sponsor banner programmatic test parity | `EmailRunToSponsorBanner.test.tsx`, `EmailRunToSponsorBanner.tsx` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave120ArchitectureTests.cs`.

**Hasher baseline note:** wave 120 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Deferred:** wave 53 export history and authority provenance alias client follow-ups — see [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE121.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE121.md) (1437–1448) when opened.
