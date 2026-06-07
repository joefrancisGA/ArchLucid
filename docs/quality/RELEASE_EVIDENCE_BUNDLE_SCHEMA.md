> **Scope:** T2-10 canonical manifest for release evidence folders — required minimum artifacts, validation, and profiles.

# Release evidence bundle schema

**Last reviewed:** 2026-06-06

## Purpose

Release, RC drill, and staging handoff flows each emit many artifacts. This schema defines a **single manifest** (`release-evidence-bundle-manifest.json`) and **profile-specific minimums** so operators and support can verify completeness before signoff or incident replay.

## Manifest

| Field | Meaning |
| --- | --- |
| `schema` | Always `archlucid.release-evidence-bundle.v1` |
| `profile` | Bundle profile id (see below) |
| `generatedUtc` | Manifest write time (UTC ISO-8601) |
| `bundleRoot` | Absolute or repo-relative folder path |
| `gitCommitSha` | Repo commit when known |
| `archLucidCliVersion` | CLI package version when known |
| `environment` | Optional environment label (release-readiness) |
| `rollup` | PASS / WARN / FAIL / HOLD / UNKNOWN |
| `requiredMinimum` | Profile definition snapshot |
| `missingRequired` | Populated at emit time when artifacts are absent |
| `artifacts` | Per-file `path`, `sha256`, `sizeBytes` (manifest excluded) |

Profile definitions live in [`scripts/ci/data/release_evidence_bundle_profiles.v1.json`](../../scripts/ci/data/release_evidence_bundle_profiles.v1.json).

## Profiles

| Profile | Producer | Minimum intent |
| --- | --- | --- |
| `release-readiness` | `scripts/Emit-ReleaseReadinessEvidence.ps1` | RC gates: observability, config lint, claim/evidence, preflight notes |
| `production-readiness-drill` | `scripts/production-readiness-drill.ps1` | Drill summary + config lint subdirectory |
| `staging-readiness` | `scripts/capture-staging-readiness-evidence.ps1` | At least one `staging-readiness-*.md` probe summary |

## Commands

Emit manifest (usually called by producers):

```powershell
.\scripts\ci\Invoke-WriteReleaseEvidenceBundleManifest.ps1 `
  -BundleDir artifacts/release-readiness `
  -Profile release-readiness `
  -Rollup PASS
```

Validate minimum artifact set:

```powershell
.\scripts\ci\Invoke-ValidateReleaseEvidenceBundle.ps1 `
  -BundleDir artifacts/release-readiness `
  -Profile release-readiness `
  -JsonOut artifacts/release-readiness/release-evidence-bundle-validation.json
```

Python equivalent:

```bash
python scripts/ci/release_evidence_bundle.py emit --dir artifacts/release-readiness --profile release-readiness --rollup PASS
python scripts/ci/release_evidence_bundle.py validate --dir artifacts/release-readiness --profile release-readiness
```

Exit codes: **0** pass, **2** missing required artifacts or manifest mismatch.

## Release-readiness minimum (profile `release-readiness`)

Required files:

- `release-readiness-index.json`, `release-readiness-summary.md`, `release-readiness-index.md`
- `redaction-note.md`
- `production-profile-preflight.md`
- `terraform-drift-preflight.json`, `terraform-drift-preflight.md`
- `validate-config.json`
- `config-lint-production-like-hosted-pilot.json`, `config-lint-production-like-hosted-pilot.md`
- `claim-evidence-consistency.json`
- `rollback-readiness-note.md`, `db-migration-status-note.md`, `k6-smoke-status-note.md`
- `real-llm-release-requirement.md`
- `release-evidence-bundle-manifest.json` (required at validation time)

Required patterns:

- `observability-export-readiness-*.md` — at least **3** files (Production, Staging, strict)

Optional (operator-attached when available): `health-ready.json`, `version.json`, `deployment-evidence.md`, `hosted-availability-rollup.md`, `retrieval-ir-report.md`, `claim-evidence-consistency.md`.

## Related

- [`docs/library/V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) — release signoff checklist
- [`docs/runbooks/ROLE_INDEX.md`](../runbooks/ROLE_INDEX.md) — release owner execution order
- [`docs/runbooks/PRODUCTION_READINESS_DRILL.md`](../runbooks/PRODUCTION_READINESS_DRILL.md) — drill interpretation
- [`docs/quality/CLAIM_EVIDENCE_CONSISTENCY_GATE.md`](CLAIM_EVIDENCE_CONSISTENCY_GATE.md) — claim/evidence gate inside release-readiness bundle
