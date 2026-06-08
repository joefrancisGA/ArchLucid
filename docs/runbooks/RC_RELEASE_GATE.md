> **Scope:** Contributor / release-engineering — which checks are **advisory on PR CI** but **blocking on RC/release** workflows.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# RC release gate — advisory on PR, blocking on RC/release

**Last reviewed:** 2026-06-07

## Objective

High-risk drift guards run as **warn-only** inside the main `ci.yml` **Docs: guards pre-corset** job so ordinary PRs stay fast. The same checks **block** RC and release cuts via **`.github/workflows/rc-release-gate.yml`**.

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
| Public pricing placeholder guard | `assert_public_pricing_placeholder_guard.py` | Accidental placeholder checkout URLs at release. |
| Release runbook/script parity | `check_release_runbook_script_parity.py` | Release docs must match executable script flags. |

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
