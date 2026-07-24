> **Scope:** Compact evaluator path for first-time buyers and sponsors — orientation and pass/hold rules. Not a second Core Pilot checklist.

# Evaluator workbook (V1)

**Audience:** First-time buyers, sponsors, and field engineers evaluating ArchLucid in the product UI.

**Primary in-app path:** [Your first architecture review](/help/core-pilot) · [Complete review workflow](/help/first-pilot-path). Use this workbook for session orientation and pass/hold interpretation — not as a CLI runbook.

---

## Prerequisites

| Item | Minimum |
| --- | --- |
| Access | Hosted pilot URL (or local API + UI for internal eval) |
| Auth | Work or school sign-in, email one-time code, or API key per tenant |
| Evidence | Uploaded briefs/diagrams/IaC, Tier-1 cloud inventory ZIP, **or** sample workspace |
| Time | One focused session (start review → analyze → finalize → exports) |

Read the [Pilot guide](/help/pilot-guide) for Pilot vs Operate before deep configuration.

**Starter proof packs:** [Accelerator chooser](/help/accelerator-chooser) · specialty templates: [Specialty review templates](/help/specialty-walkthroughs).

---

## Session flow (four steps)

1. **Start** an architecture review from **New architecture review** (`/reviews/new`). Optional: greenfield preset `?preset=greenfield`.
2. **Add evidence** and start analysis on the review.
3. **Finalize** the architecture package (locks the signed review record).
4. **Collect proof** — sponsor packet, executive summary, and audit export from review detail.

Narrative: [Your first architecture review](/help/core-pilot).

<details>
<summary>Administrator details — CLI and proof collectors</summary>

Sales engineers and platform admins may also collect proof folders with CLI helpers after finalize:

```powershell
$env:ARCHLUCID_API_URL = 'https://your-pilot.example'
./scripts/collect-first-pilot-proof.ps1 -BaseUrl $env:ARCHLUCID_API_URL -RunId '<review-id-after-finalize>'
```

Local demo stack:

```powershell
dotnet run --project ArchLucid.Cli -- try --sponsor-packet --out artifacts/proof
```

Prefer the in-app Core Pilot path for buyer-facing evaluations.

</details>

---

## Expected artifacts

| Artifact | Purpose |
| --- | --- |
| Signed review record | Authoritative finalize snapshot on the architecture package |
| Findings | Severity, disposition, and evidence-backed recommendations |
| Sponsor packet / first-value report | Sponsor narrative with ROI basis labels |
| Audit export | Scoped event CSV when your role includes audit access |

Internal proof folders (command center, go/no-go JSON) are for SE/ops handoff — not required for a UI-only evaluation.

---

## Pass / hold / deferred interpretation

| Label | Meaning | Evaluator action |
| --- | --- | --- |
| **PASS** | No blocking findings | Proceed; optional WARN review |
| **PASS_WITH_WARNINGS** | Non-blocking gaps | Document WARN rows before external send |
| **BLOCK** | Sponsor handoff unsafe | Fix remediation; do not send |
| **SEND** | Sponsor packet disposition | Ready for sponsor share |
| **HOLD** | Fix listed blockers | Re-finalize or re-run assessment after fixes |
| **DEFERRED_SCOPE** | V1.1/V2 buyer ask | Record requirement; do not score as V1 failure |

Evidence-basis labels (**Evidence-backed**, **Estimate**, **Demo-derived**, **Low support**, **Manual review required**, **Deferred scope**) apply to sponsor surfaces.

---

## Stop rules

Stop and escalate when:

- PilotStrict signals are unresolved on a real-mode host.
- ROI figures appear without a clear basis label.
- Data-consistency or sponsor-stop probes show HOLD.
- Procurement deal-ready disposition is **HOLD** for missing V1 docs (not deferred realism).

Stuck mid-pilot: [Troubleshooting](/help/troubleshooting) · [Report a problem](/help/report-a-problem).

---

## Optional depth (after first finalize)

| Topic | In-app help |
| --- | --- |
| Specialty accelerators | [Specialty review templates](/help/specialty-walkthroughs) |
| Security / trust | [Security and trust](/help/security-trust) |
| Procurement pack | [Procurement FAQ](/help/procurement) |

V1.1 connectors (Jira, ServiceNow, Slack, Teams, MCP) are **not** required for first value.

---

## Depth (former EVALUATION_GUIDE)

### Part 1: Your first 30 minutes

Use [Get started](https://archlucid.net/get-started) or [`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md) for the hosted buyer sequence. It is the canonical orientation path; this workbook retains only the evaluator interpretation below.

### Core Pilot details

The Core Pilot is four steps: create an architecture review, run the authority pipeline, finalize the durable architecture package, and open its artifacts. Start with the curated sample to learn the destination, then use [`SECOND_RUN.md`](../library/SECOND_RUN.md) for the lowest-friction real-input second review.

Evaluate whether the request is accurately captured, findings are relevant and plausible, the package is useful, and the governance pre-finalize gate reflects your severity thresholds. For procedure and recovery, use [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) and [`FIRST_PILOT_TROUBLESHOOTING.md`](../runbooks/FIRST_PILOT_TROUBLESHOOTING.md).

---

## Related

- [Your first architecture review](/help/core-pilot)
- [Choose your next step](/help/path-chooser)
- [Pilot guide](/help/pilot-guide)
