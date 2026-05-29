> **Scope:** Compact evaluator path — references canonical runbooks; not a second checklist.

# Evaluator workbook (V1)

**Audience:** First-time buyers, sponsors, and field engineers evaluating ArchLucid without becoming operators.

**Canonical operator checklist:** [`runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) — operators follow that path; evaluators use this workbook for orientation and pass/hold rules.

---

## Prerequisites

| Item | Minimum |
| --- | --- |
| Access | Hosted pilot URL or local API + UI |
| Auth | Entra/OIDC bearer or API key per tenant |
| Evidence | Tier-1 Azure extractor ZIP **or** accepted demo workspace |
| Time | One focused session (create → execute → commit) |

Read [`go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md`](../go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md) for Pilot vs Operate before deep configuration.

---

## Session flow (four steps)

1. **Create** architecture review (UI or `archlucid run create`).
2. **Execute** with evidence attached.
3. **Commit** manifest (unit of truth).
4. **Collect proof** after commit.

Narrative: [`CORE_PILOT.md`](../CORE_PILOT.md). Evidence detail: [`runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md).

### First commands (hosted pilot)

```powershell
$env:ARCHLUCID_API_URL = 'https://your-pilot.example'
./scripts/collect-first-pilot-proof.ps1 -BaseUrl $env:ARCHLUCID_API_URL -RunId '<run-id-after-commit>'
```

Sponsor send:

```powershell
./scripts/collect-first-pilot-proof.ps1 -BaseUrl $env:ARCHLUCID_API_URL -RunId '<run-id>' -SponsorHandoff
```

---

## Expected artifacts

| Artifact | Purpose |
| --- | --- |
| `go-no-go-summary.md` / `.json` | Machine + human disposition |
| `first-pilot-command-center.md` | Single **NEXT ACTION** surface |
| `first-pilot-evidence/` | Committed-run buyer-safe bundle |
| `first-value-report.md` | Sponsor narrative (basis labels required) |
| `commercial-next-step.json` | SEND / HOLD / deferred mapping |

---

## Pass / hold / deferred interpretation

| Label | Meaning | Evaluator action |
| --- | --- | --- |
| **PASS** | No blocking findings | Proceed; optional WARN review |
| **PASS_WITH_WARNINGS** | Non-blocking gaps | Document WARN rows before external send |
| **BLOCK** | Sponsor handoff unsafe | Fix remediation column; do not send |
| **SEND** | Sponsor packet disposition | Use [`go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md`](../go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md) |
| **HOLD** | Fix listed blockers | Re-run proof with same `RunId` |
| **DEFERRED_SCOPE** | V1.1/V2 buyer ask | Record requirement; do not score as V1 failure |

Evidence-basis labels (**Evidence-backed**, **Estimate**, **Demo-derived**, **Low support**, **Manual review required**, **Deferred scope**) apply to sponsor surfaces — see [`library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md).

---

## Stop rules

Stop and escalate when:

- PilotStrict signals are unresolved on a real-mode host.
- `roiSponsorSafe` is false and projected dollars appear unlabeled.
- `dataConsistencyStatus` is `NOT_RUN` or `HOLD` with sponsor-stop probes.
- Procurement deal-ready disposition is **HOLD** for missing V1 docs (not deferred realism).

Stuck mid-pilot: [`runbooks/FIRST_PILOT_TROUBLESHOOTING.md`](../runbooks/FIRST_PILOT_TROUBLESHOOTING.md) · [`runbooks/PILOT_RESCUE_PLAYBOOK.md`](../runbooks/PILOT_RESCUE_PLAYBOOK.md).

---

## Optional depth (after first commit)

| Topic | Doc |
| --- | --- |
| Specialty accelerators | [`library/walkthroughs/README.md`](../library/walkthroughs/README.md) |
| Demo proof shape (no setup) | [`go-to-market/demo-proof-packets/README.md`](../go-to-market/demo-proof-packets/README.md) |
| Security review | [`go-to-market/SECURITY_REVIEWER_ONE_PAGER.md`](../go-to-market/SECURITY_REVIEWER_ONE_PAGER.md) |
| Procurement pack | [`go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`](../go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md) |

V1.1 connectors (Jira, ServiceNow, Slack, Teams, MCP) are **not** required for first value.

---

## Related

- [`START_HERE.md`](../START_HERE.md) — role-based entry hub
- [`onboarding/EVALUATION_GUIDE.md`](EVALUATION_GUIDE.md) — extended evaluation depth (not a second checklist)
