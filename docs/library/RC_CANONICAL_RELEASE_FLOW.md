> **Scope:** Contributor-reference — single canonical RC readiness order for release owners; reduces branching across release scripts and checklists.

# RC canonical release flow

**Audience:** release owner cutting a buyer-facing release candidate.

**Authoritative environment:** **Staging** — see [`RC_TARGET_ENVIRONMENT_MATRIX.md`](RC_TARGET_ENVIRONMENT_MATRIX.md).

**Advanced mode:** individual scripts remain available; this doc is the default path only.

---

## Decision matrix

| Release intent | Required path | Strict buyer RC? |
|----------------|---------------|------------------|
| Internal dev smoke | `scripts/run-readiness-check.ps1` | No |
| RC candidate (engineering) | Canonical flow §1–4 below | No (inspect rollup warnings) |
| Buyer-facing RC signoff | Canonical flow §1–5 below | **Yes** (`-StrictRc` / `ARCHLUCID_STRICT_RC=1`) |
| Simulator-only claim waiver | §5 + approved `simulator-only-override.md` | Strict with waiver |

---

## Canonical order of operations

### 1. Build and fast gates

```powershell
.\scripts\build-release.ps1
.\scripts\run-readiness-check.ps1
```

### 2. Release smoke + live UI-SQL parity

```powershell
.\scripts\release-smoke.ps1
# RC profile artifacts → artifacts/release-smoke-live-ui-sql-result.json
```

See [`RELEASE_SMOKE.md`](RELEASE_SMOKE.md).

### 3. Emit release-readiness evidence bundle

```powershell
.\scripts\Emit-ReleaseReadinessEvidence.ps1 -BundleDir artifacts/release-readiness
```

Produces manifest, confidence rollup, RC verdict, deploy handoff, and related machine-readable outputs. Schema: [`RELEASE_EVIDENCE_BUNDLE_SCHEMA.md`](../quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md).

### 4. Validate bundle (default profile)

```powershell
.\scripts\ci\Invoke-ValidateReleaseEvidenceBundle.ps1 `
  -BundleDir artifacts/release-readiness `
  -Profile release-readiness
```

### 5. Strict buyer RC signoff (external claims only)

```powershell
.\scripts\Emit-ReleaseReadinessEvidence.ps1 -BundleDir artifacts/release-readiness -StrictRc
.\scripts\ci\Invoke-ValidateReleaseEvidenceBundle.ps1 `
  -BundleDir artifacts/release-readiness `
  -Profile release-readiness `
  -StrictBuyerRc
python scripts/ci/assert_rc_strict_signoff.py `
  --bundle-dir artifacts/release-readiness `
  --require-pass `
  --require-live-parity-artifact
```

Inspect `strictDisposition`, `strictBlockingReasons`, and `realModeAiEvidence.status` in the bundle validation JSON.

**Real-mode evidence:** owner dev staging Azure OpenAI via `Invoke-RealLlmEvidenceGate.ps1` — or attach `simulator-only-override.md` for simulator-only RC wording.

---

## Weekly proof cadence (market signal)

After RC artifacts exist:

```powershell
.\scripts\Invoke-WeeklyProofCadence.ps1 -ReleaseBundleDir artifacts/release-readiness
```

Runbook: [`WEEKLY_PROOF_CADENCE.md`](../runbooks/WEEKLY_PROOF_CADENCE.md).

---

## Cross-refs

| Doc | Role |
|-----|------|
| [`V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md) | Human checklist (boxes) |
| [`RELEASE_LOCAL.md`](RELEASE_LOCAL.md) | Script reference |
| [`RC_RELEASE_GATE.md`](../runbooks/RC_RELEASE_GATE.md) | CI workflow policy |
| [`CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit`](../go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) (`SPONSOR_CLAIM_LABEL_AUDIT.md` alias) | Sponsor export label guards |
