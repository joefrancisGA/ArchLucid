> **Reviewed:** 2026-07-25

> **Scope:** Operator-facing evidence packet template — minimum artifacts for first pilot and RC signoff.
> **Canonical sources:** [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md), [`V1_RELEASE_CHECKLIST.md`](../../library/V1_RELEASE_CHECKLIST.md).

# Evidence packet — operator / pilot lead (template)

**Audience:** Pilot operator, sales engineer, release owner running first value on Staging.

**Auth default (Staging):** Bearer JWT via `-BearerToken` or `ARCHLUCID_BEARER_TOKEN` — [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../../library/RC_TARGET_ENVIRONMENT_MATRIX.md).

---

## Mandatory for V1 pilot completion

| Step | Artifact / command | Pass criterion |
| --- | --- | --- |
| Platform ready | `archlucid doctor` | Connection OK; auth mode not DevelopmentBypass on Staging |
| First commit | [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md) Phase C | Run reaches **Committed** |
| Staging live probes | `capture-staging-readiness-evidence.ps1 -BaseUrl … -BearerToken …` | `/health/live`, `/health/ready`, `/version` PASS |
| RC drill | `v1-rc-drill.ps1 -ApiBaseUrl … -BearerToken …` | `artifacts/v1-rc-drill-result.json` disposition PASS |
| Proof pipeline | `collect-first-pilot-proof.ps1 -RunId …` | `go-no-go-summary.json` with `blockCount=0` for sponsor handoff |

## Mandatory for RC / release signoff

| Artifact | Producer | Notes |
| --- | --- | --- |
| `release-readiness/` bundle | `Emit-ReleaseReadinessEvidence.ps1 -StrictRc -ApiBaseUrl …` | Live rows require Staging URL |
| `rc-go-no-go-verdict.json` | Strict RC emitter | HOLD blocks promotion |
| `deploy-handoff.json` | Strict RC emitter | Missing SHA/version fails strict mode |
| `first-pilot-strict-summary.json` | `Invoke-FirstPilotStrictPath.ps1` | Check `evidenceScope`: `local-plus-staging-live` for contract evidence |

## Optional (recommended before sponsor send)

| Artifact | When |
| --- | --- |
| `support-bundle-*.zip` | Triage or support escalation |
| `admin-operational-posture.md` | Production-like preflight |
| `data-consistency-readiness/` | Multi-tenant or SQL drift concerns |
| `ai-readiness-gate.json` | Real-mode or PilotStrict pilots |

## One-command strict path (hybrid)

```powershell
# Local gates only (CI smoke — NOT Staging contract evidence):
./scripts/Invoke-FirstPilotStrictPath.ps1

# Full Staging contract evidence:
$env:ARCHLUCID_API_BASE_URL = 'https://<staging-host>'
$env:ARCHLUCID_BEARER_TOKEN = '<jwt>'
./scripts/Invoke-FirstPilotStrictPath.ps1
```

## Failure triage

| Symptom | First doc |
| --- | --- |
| HOLD on go/no-go | [`FIRST_PILOT_TRIAGE_CARDS.md`](../../runbooks/FIRST_PILOT_TRIAGE_CARDS.md) |
| Auth 401 on Staging | [`SECURITY.md`](../../library/contributor-reference/SECURITY.md) — confirm Bearer, not DevelopmentBypass |
| RC drill FAIL | [`V1_RC_DRILL.md`](../../library/V1_RC_DRILL.md) |

## Related

- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
- [`ROLE_INDEX.md`](../../runbooks/ROLE_INDEX.md#v1-critical-path-mandatory-docs)
