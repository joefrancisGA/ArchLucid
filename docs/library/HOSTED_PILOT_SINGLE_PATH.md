> **Scope:** Operator cookbook — canonical single-path command sequence for first **hosted pilot** success — one authoritative flow; advanced paths are troubleshooting only.

# Hosted pilot — single path quickstart

**Audience:** Operator or platform engineer cutting the first hosted pilot on ArchLucid-managed Azure.

**Canonical script:** `.\scripts\Invoke-FirstPilotStrictPath.ps1` (strict RC gates + consolidated evidence index).

**Do not branch** until this path completes or emits an explicit **HOLD** with remediation.

---

## Prerequisites (one checklist)

1. Azure Staging (or agreed RC) API base URL and Bearer JWT for live probes — see [`RC_TARGET_ENVIRONMENT_MATRIX.md`](RC_TARGET_ENVIRONMENT_MATRIX.md).
2. Repository clone at the release candidate commit.
3. Python 3.11+ and PowerShell 7 on the operator workstation.

---

## Single command path

From the repository root:

```powershell
$env:ARCHLUCID_API_BASE_URL = "https://your-staging-api.example"
$env:ARCHLUCID_BEARER_TOKEN = "<staging-jwt>"
.\scripts\Invoke-FirstPilotStrictPath.ps1 -OutDir artifacts/first-pilot-strict
```

### Expected outputs (stop/fail checkpoints)

| Step | Artifact | PASS signal |
| --- | --- | --- |
| 1 | `artifacts/first-pilot-strict/release-readiness/rc-go-no-go-verdict.json` | `"verdict": "PASS"` or documented `"WARN"` with sponsor caveats |
| 2 | `artifacts/first-pilot-strict/release-readiness/rc-decision-narrative.md` | Decision line matches verdict |
| 3 | `artifacts/first-pilot-strict/release-readiness/first-pilot-timing-budget.json` | `firstValueCommitBudget.disposition` is **PASS** or **WARN** (not silent omission) |
| 4 | `artifacts/first-pilot-strict/first-pilot-strict-summary.json` | `evidenceScope` = `local-plus-staging-live` when API URL supplied |

**HOLD:** Do not send sponsor materials until blockers in `rc-go-no-go-verdict.json` → `blockers` are cleared or explicitly waived per [`RC_RELEASE_GATE.md`](../runbooks/RC_RELEASE_GATE.md).

---

## After strict path (optional proof rollup)

When attaching sponsor packet evidence for a named environment run:

```powershell
.\scripts\collect-first-pilot-proof.ps1 -ProofDirectory artifacts/first-pilot-proof -RunId "<run-id>"
```

---

## Advanced / troubleshooting (not the first path)

| Topic | Doc |
| --- | --- |
| Full release checklist | [`V1_RELEASE_CHECKLIST.md`](V1_RELEASE_CHECKLIST.md) |
| Release smoke only | [`RELEASE_SMOKE.md`](RELEASE_SMOKE.md) |
| Live E2E parity matrix | [`LIVE_E2E_AUTH_PARITY.md`](LIVE_E2E_AUTH_PARITY.md) |
| First pilot evidence bundle | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md) |
| Build / local stack | [`docs/engineering/BUILD.md`](../engineering/BUILD.md) |

---

## Related

- [`customer-facing/PILOT_GUIDE.md`](customer-facing/PILOT_GUIDE.md) — redirect spine
- [`MINIMUM_VIABLE_PILOT_SUCCESS.md`](MINIMUM_VIABLE_PILOT_SUCCESS.md) — five-step buyer success lane
- [`EXECUTIVE_SPONSOR_BRIEF.md`](../go-to-market/EXECUTIVE_SPONSOR_BRIEF.md) — sponsor narrative of record
