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
| `realModeAiEvidence` | Missing/current/stale/PASS/WARN/HOLD status for `real-llm-evidence-gate.json` without making live Azure calls |

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

Optional (operator-attached when available): `health-ready.json`, `version.json`, `deployment-evidence.md`, `hosted-availability-rollup.md`, `retrieval-ir-report.md`, `claim-evidence-consistency.md`, `real-llm-evidence-gate.json`, `real-llm-evidence-gate.md`, `simulator-only-override.md`.

Release readiness also emits `ai-quality-release-summary.json` and `.md` when `scripts/Emit-ReleaseReadinessEvidence.ps1` runs. The summary labels source evidence separately as:

- **offline fixture** — retrieval IR and faithfulness reports from repo quality gates,
- **committed-run** — `retrieval-grounding.json` and `go-no-go-summary.json` when attached,
- **live-real-mode** — `real-llm-evidence-gate.json` when attached.

Missing optional sources are explicit and do not become PASS by inference.

## Release confidence rollup

`release-confidence-rollup.json` summarizes validation **lanes** (full regression, outbox-focused tests, release evidence tests, doc link check, UI unit, Azure extractor + Terraform emit acceptance). Lane definitions live in [`scripts/ci/data/release_confidence_lanes.v1.json`](../../scripts/ci/data/release_confidence_lanes.v1.json). The default local emitter does **not** execute full regression; MISSING and STALE are explicit. For buyer-facing RC signoff, enable **strict RC** (`--strict-rc` / `ARCHLUCID_STRICT_RC=1`) so `strictDisposition` and `strictBlockingReasons` are populated and non-PASS release-blocking lanes fail the script.

**RC signoff artifacts (additive):**

| Artifact | Schema | Purpose |
| --- | --- | --- |
| `rc-go-no-go-verdict.json` | `archlucid.rc-go-no-go-verdict.v1` | Unified PASS/HOLD/WARN verdict with blocker list |
| `deploy-handoff.json` | `archlucid.deploy-handoff.v1` | Deterministic deploy handoff + Azure metadata; includes `authoritativeLiveEvidenceEnvironment` (**Staging**) |

**Authoritative live environment:** **Staging** is contract-authoritative for RC drill, live API probes, and sponsor proof attachment. Repo-local `-Environment Production` on the emitter labels **appsettings** reports only. See [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../library/RC_TARGET_ENVIRONMENT_MATRIX.md) and [`scripts/ci/data/rc_target_environment_matrix.v1.json`](../../scripts/ci/data/rc_target_environment_matrix.v1.json).
| `rc-test-evidence-manifest.json` | `archlucid.rc-test-evidence-manifest.v1` | Suite/gate status snapshot for RC audit |
| `rc-evidence-signoff-bundle.json` | `archlucid.rc-evidence-signoff-bundle.v1` | Unified per-gate RC signoff (**PASS/WARN/HOLD/SKIPPED**) for release-smoke, live parity, config lint, OpenAPI, data consistency, AI readiness, and claim boundary |
| `pilot-critical-performance-evidence.json` | `archlucid.pilot-critical-performance-evidence.v1` | Pilot-critical flow timings (not a load test) |
| `real-mode-claim-gate.json` | `archlucid.real-mode-claim-gate.v1` | Claim boundary + `claimWordingClass` |
| `azure-iac-parity-proof.json` | `archlucid.azure-iac-parity-proof.v1` | IaC/config parity proof for hosted Azure |
| `managed-identity-verification.json` | `archlucid.managed-identity-verification.v1` | Hosted MI posture verification |
| `azure-extractor-terraform-emit-status.json` | `archlucid.azure-extractor-terraform-emit-status.v1` | Extractor + Terraform emit acceptance lane |

## Documentation ownership

Each profile may declare `docOwners` — canonical docs that must stay aligned when profile artifacts change. See [`release_evidence_bundle_profiles.v1.json`](../../scripts/ci/data/release_evidence_bundle_profiles.v1.json).

**Shared CI helpers:** Release-evidence Python scripts should reuse [`scripts/ci/release_evidence_common.py`](../../scripts/ci/release_evidence_common.py) for JSON loading, strict RC evaluation, and RC environment matrix lookups.

**Role-specific packet templates:** [`evidence-packet-buyer.template.md`](../go-to-market/templates/evidence-packet-buyer.template.md), [`FIRST_PILOT_EVIDENCE_BUNDLE.md#operator-pilot-lead-evidence-packet`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#operator-pilot-lead-evidence-packet) (`evidence-packet-operator.template.md` alias), [`FIRST_PILOT_EVIDENCE_BUNDLE.md#security-reviewer-evidence-packet`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md#security-reviewer-evidence-packet) (`evidence-packet-security-reviewer.template.md` alias).

## Real-mode AI evidence status

The bundle validator never calls Azure OpenAI. It only reads an attached `real-llm-evidence-gate.json` produced by [`scripts/Invoke-RealLlmEvidenceGate.ps1`](../../scripts/Invoke-RealLlmEvidenceGate.ps1).

| Status | Meaning | Claim boundary |
| --- | --- | --- |
| `MISSING` | No `real-llm-evidence-gate.json` in the bundle | Simulator-only unless an approved simulator-only override is present |
| `PASS` | Current `archlucid.real-llm-evidence-gate.v2`, `overallOutcome=PASS`, `executionMode=real`, all four agent paths present | Full real-mode AI evidence wording allowed |
| `WARN` | Current artifact reports partial/marginal evidence | Partial-real wording only |
| `HOLD` | Current artifact is invalid, failed, or not full real mode | Claims limited to simulator-only or partial-real posture |
| `STALE` | Artifact is older than 30 days or missing `generatedUtc` | Re-run `Invoke-RealLlmEvidenceGate.ps1` before claiming current real-mode status |

## Related

- [`docs/library/V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) — release signoff checklist
- [`docs/runbooks/ROLE_INDEX.md`](../runbooks/ROLE_INDEX.md) — release owner execution order
- [`docs/runbooks/PRODUCTION_READINESS_DRILL.md`](../runbooks/PRODUCTION_READINESS_DRILL.md) — drill interpretation
- [`docs/quality/CLAIM_EVIDENCE_CONSISTENCY_GATE.md`](CLAIM_EVIDENCE_CONSISTENCY_GATE.md) — claim/evidence gate inside release-readiness bundle
