> **Scope:** Contributor / release-engineering — which checks are **advisory on PR CI** but **blocking on RC/release** workflows.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# RC release gate — advisory on PR, blocking on RC/release

**Last reviewed:** 2026-06-07

## Objective

High-risk drift guards run as **warn-only** inside the main `ci.yml` **Docs: markdown link integrity** job so ordinary PRs stay fast. When a PR touches buyer-facing paths (`docs/go-to-market/**`, marketing UI, `V1_SCOPE.md`, trust/pricing docs), **`run_buyer_surface_strict_guards.py`** and **`report_real_mode_evidence_freshness.py --strict`** run as **merge-blocking** in the same job. The same checks **block** RC and release cuts via **`.github/workflows/rc-release-gate.yml`**.

## Triggers

- Git tags matching `v*-rc*`
- Branches matching `release/**`
- Manual `workflow_dispatch`

## Blocking checks (RC/release only)

| Check | Script | Why it blocks on RC |
| --- | --- | --- |
| Tenant isolation defense-in-depth | `assert_tenant_isolation_defense_in_depth.py` | Cross-tenant data harm is irreversible. |
| Mutating route idempotency drift | `detect_mutating_route_idempotency_drift.py` | Write-path contract drift breaks clients and audit replay. |
| OpenAPI mutations in audit matrix | `assert_openapi_mutations_in_audit_matrix.py` | Unaudited mutations breach governance posture. |
| Controller audit matrix | `check_audit_matrix.py` | Same; controller-level coverage. |
| Buyer-facing canonical claim drift | `check_buyer_claim_drift.py` | Buyer-safe claim boundaries must not drift at release. |
| Procurement claim coherence | `check_procurement_claim_coherence.py` | Procurement pack and assurance docs must stay internally consistent at release. |
| Public pricing placeholder guard | `assert_public_pricing_placeholder_guard.py` | Accidental placeholder checkout URLs at release. |
| Release runbook/script parity | `check_release_runbook_script_parity.py` | Release docs must match executable script flags. |
| Route tier policy nav parity | `assert_route_tier_policy_nav.py` (with `--markdown-report` + `--json-summary-out` RC artifacts) | Procurement/security reviewers rely on fresh route registry. |
| Sponsor evidence label consistency | `check_sponsor_evidence_label_consistency.py` | Sponsor-facing docs must keep evidence-basis labels and forbid over-claims. |
| Sponsor packet contract | `check_sponsor_packet_contract.py` | Sponsor export schema must not drift at release. |
| ROI surface consistency | `check_roi_surface_consistency.py` | ROI copy must stay aligned with proof posture. |
| SAQ release gate | `report_saq_release_gate.py` | Open P0 strong-model architecture questions require explicit RC disposition or waiver. |

## Release evidence strict (RC)

Job **`release-evidence-gates`** runs unit tests plus self-tests that **empty** evidence folders fail strict RC validation:

- `python scripts/ci/build_release_confidence_rollup.py --strict-rc` on an empty temp bundle (must exit non-zero)
- `python scripts/ci/release_evidence_bundle.py validate --profile release-readiness --strict-buyer-rc` on an empty temp bundle (must exit non-zero)

Release owners attach a populated `artifacts/release-readiness/` folder before buyer-facing signoff; validate with:

```powershell
.\scripts\ci\Invoke-ValidateReleaseEvidenceBundle.ps1 -BundleDir artifacts/release-readiness -Profile release-readiness
python scripts/ci/release_evidence_bundle.py validate --dir artifacts/release-readiness --profile release-readiness --strict-buyer-rc
```

**Buyer-facing RC packet minimum** (`--strict-buyer-rc`): `real-mode-claim-gate.json`, `real-mode-claim-gate.md`, `real-mode-evidence-freshness.json`, `rc-go-no-go-verdict.json` (or explicit `simulator-only-override.md` waiver for honest simulator-only posture).

## Observability readiness (RC)

Job **`observability-readiness`** emits `observability-export-readiness.md` via `scripts/report_observability_export_readiness.py --environment Production`. Attach the artifact to release evidence bundles before buyer-facing signoff.

## RC signoff gate (blocking)

Job **`rc-signoff-gate`** composes `rc-evidence-signoff-bundle.json` / `.md` and `rc-go-no-go-verdict.json` from claim gate, canary gate, observability, SAQ, and route/tier/policy/nav artifacts. It then runs **`assert_rc_strict_signoff.py`** to verify machine-readable references exist, and **proves fail-closed behavior** by asserting `--strict-rc` / `--require-pass` exit non-zero when high-risk gates are SKIPPED or live UI-SQL parity artifacts are absent. Buyer-facing RC cuts must pass `assert_rc_strict_signoff.py --require-pass --require-live-parity-artifact` on a populated `artifacts/release-readiness/` bundle (also enforced at the end of `Emit-ReleaseReadinessEvidence.ps1` when strict RC mode is on).

Local strict validation:

```powershell
python scripts/ci/assert_rc_strict_signoff.py `
  --bundle-dir artifacts/release-readiness `
  --require-pass `
  --require-live-parity-artifact
```

Local reproduction (signoff composition):

```powershell
python scripts/ci/build_pilot_critical_performance_evidence.py `
  --bundle-dir artifacts/release-readiness `
  --json-out artifacts/release-readiness/pilot-critical-performance-evidence.json `
  --markdown-out artifacts/release-readiness/pilot-critical-performance-evidence.md

python scripts/ci/build_rc_evidence_signoff_bundle.py `
  --bundle-dir artifacts/release-readiness `
  --json-out artifacts/release-readiness/rc-evidence-signoff-bundle.json `
  --markdown-out artifacts/release-readiness/rc-evidence-signoff-bundle.md `
  --strict-rc
```

Open P0 SAQs in `docs/library/SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md` produce **HOLD** unless release owners attach a structured waiver JSON to `report_saq_release_gate.py --waiver-json`. The waiver must name the SAQ id, owner, rationale, compensating controls, affected claims/features, and expiry or reassessment trigger.

## Real-mode claim gate (RC)

Job **`real-mode-claim-gate`** emits `real-mode-claim-gate.json` via `scripts/ci/check_release_real_mode_claim.py --rc-strict-claims --expected-commit-sha <RC commit>`. Real-mode gate JSON must record matching `gitCommitSha` (written by `Invoke-RealLlmEvidenceGate.ps1` at generation time). Repository CI uses `--allow-simulator-only` for honest simulator posture; buyer-facing RC cuts must attach real evidence or an explicit waiver in the release bundle. JSON includes `blockingReasons` consumed by the RC go/no-go verdict.

## Live UI/API/SQL parity (RC blocking)

Job **`ui-e2e-live-rc`** runs Playwright **`@release-gate`** specs against SQL-backed **ArchLucid.Api** (simulator mode). This is **blocking** on `release/**` branches and `v*-rc*` tags. Ordinary PR **`ci.yml`** `ui-e2e-live` remains warn-only.

Local reproduction: `.\scripts\release-smoke-live-ui-sql.ps1`

## Real-model canary (RC strict)

Job **`real-model-canary`** emits `real-model-canary-gate.json` via `scripts/ci/emit_real_model_canary_gate.py`.

| Context | Credential missing | Canary fail |
| --- | --- | --- |
| Ordinary PR / main CI | Skip allowed (warn) | Does not block merge |
| RC / release tag (`--rc-strict`) | **Waiver-required fail** unless owner waiver env vars are set | Blocks RC workflow |

**Waiver authority:** release owner (you). Required env vars when intentionally skipping live canary on RC:

- `ARCHLUCID_REAL_MODE_CANARY_WAIVER=1`
- `ARCHLUCID_REAL_MODE_CANARY_WAIVER_OWNER` — owner identity string
- `ARCHLUCID_REAL_MODE_CANARY_WAIVER_RATIONALE` — short documented reason

Without waiver, missing credentials produce disposition `WAIVER_REQUIRED_FAIL` and exit code **1**.

## PR CI remains advisory

Do **not** remove `continue-on-error: true` from the guards pre-corset job in `ci.yml` for these checks — that preserves PR velocity. RC blocking is enforced only in `rc-release-gate.yml`.

## Related

- [`CI_RELEASE_GATE.md`](CI_RELEASE_GATE.md) — general block vs warn policy
- [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md)
- Workflow: `.github/workflows/rc-release-gate.yml`
