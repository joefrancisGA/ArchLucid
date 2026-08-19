> **Reviewed:** 2026-08-03

> **Scope:** One-screen buyer orientation — Pilot vs Operate, first proof, deferred scope, pass/hold interpretation, stop rules, and next-step chooser. Absorbs the former evaluator workbook body. Not an operator checklist.

# Buyer orientation (one screen)

**Last reviewed:** 2026-08-03

**Start operators here:** [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) · **Four-step narrative:** [`../CORE_PILOT.md`](../CORE_PILOT.md) · **Path choice (demo / real / sponsor):** [`../runbooks/FIRST_EVALUATOR_DECISION.md`](../runbooks/FIRST_EVALUATOR_DECISION.md)

## Two layers

| Layer | What you get in V1 | When to use it |
| --- | --- | --- |
| **Pilot** | One defensible architecture review: finalized architecture package, findings, artifacts, sponsor exports | First value — prove the architecture package on your evidence or an accepted demo workspace |
| **Operate** | Compare, replay, graph depth, governance, audit, policy packs | After first commit when you need investigation or governance workflows |

## What to do first (buyer / evaluator)

1. Read [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) for the outcome story.
2. Skim [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) for evidence-linked comparison vs generic AI.
3. Run or observe one **Core Pilot** review (your Azure extractor ZIP or explicit demo acceptance).
4. Inspect the **first-value report** and proof disposition before external circulation.

## What proof you get after a finalized review

| Artifact | Purpose |
| --- | --- |
| First-value report (Markdown/PDF) | Sponsor summary with evidence-basis labels and ROI posture |
| `first-pilot-command-center.md` | Phased READY / WARN / HOLD / DEFERRED + one **NEXT ACTION** |
| `go-no-go-summary.md` | Full proof findings table |
| `quote-to-proof-packet.md` | Commercial next step after PASS proof |
| `commercial-closeout.md` | Deterministic Evidence Pack / ARB / order-form next action |
| [`DIFFERENTIATION_PROOF_PACKET.md`](DIFFERENTIATION_PROOF_PACKET.md) | Why ArchLucid vs generic AI (evidence-linked) |
| Procurement pack (on request) | Trust, DPA, CAIQ/SIG, self-assessment — not CPA attestation |

Collect with [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md); working directory default: `artifacts/first-pilot-proof/`.

## Pass / hold / deferred interpretation {#pass-hold-deferred-interpretation}

Former evaluator-workbook body — how to read dispositions on sponsor and proof surfaces.

| Label | Meaning | Evaluator action |
| --- | --- | --- |
| **PASS** | No blocking findings | Proceed; optional WARN review |
| **PASS_WITH_WARNINGS** | Non-blocking gaps | Document WARN rows before external send |
| **BLOCK** | Sponsor handoff unsafe | Fix remediation; do not send |
| **SEND** | Sponsor packet disposition | Ready for sponsor share |
| **HOLD** | Fix listed blockers | Re-finalize or re-run assessment after fixes |
| **DEFERRED_SCOPE** | V1.1/V2 buyer ask | Record requirement; do not score as V1 failure |

Evidence-basis labels (**Evidence-backed**, **Estimate**, **Demo-derived**, **Low support**, **Manual review required**, **Deferred scope**) apply to sponsor surfaces.

## Stop rules {#evaluator-stop-rules}

Stop and escalate when:

- Pilot host integrity signals are unresolved on a real-mode host.
- ROI figures appear without a clear basis label.
- Data-consistency or sponsor-stop probes show **HOLD**.
- Procurement deal-ready disposition is **HOLD** for missing V1 docs (not deferred realism).

Stuck mid-pilot: [Troubleshooting](/help/troubleshooting) · [Report a problem](/help/report-a-problem).

## Trust and procurement (without overclaiming)

| Topic | V1 posture |
| --- | --- |
| SOC 2 | In-repo **self-assessment** and roadmap — **not** CPA Type II attestation |
| Third-party pen test | **Deferred** — not claimed as completed for V1 |
| Live checkout / marketplace | **Deferred** — sales-led quote and order form |
| AI output | **Decision support** — see [`AI_READINESS_POSTURE.md#ai-output-is-decision-support`](AI_READINESS_POSTURE.md#ai-output-is-decision-support) |
| Audit trail | Example reviewer path — [`BUYER_SECURITY_PROCUREMENT_PACKET.md#example-audit-walkthrough-one-finalized-review`](BUYER_SECURITY_PROCUREMENT_PACKET.md#example-audit-walkthrough-one-finalized-review) |
| Trust index | [`trust-center.md`](trust-center.md) |

## Explicitly deferred (not V1 requirements)

Jira, ServiceNow, Confluence, Slack connectors (V1.1), MCP, live Stripe checkout, public reference customers, SOC 2 CPA attestation — see [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md).

## Choose your next step

Use this when you are unsure which document or UI surface to open next. Each branch has **one primary action** and **one fallback**.

| Your goal | Primary next action | Fallback |
| --- | --- | --- |
| **I want to evaluate ArchLucid** | Read this page, then run or observe one Core Pilot review | Open in-app help: **Pilot guide** (`/help/pilot-guide`) |
| **I am stuck mid-pilot** | Follow [Your first architecture review](/help/first-architecture-review) | Open in-app help: **Troubleshooting** (`/help/troubleshooting`) |
| **I need procurement or security evidence** | Start at [Security and trust](/help/security-trust) and request a pack via [PROCUREMENT_PACK_INDEX.md](PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack) | Read [Data handling and tenant isolation](/help/data-handling#isolation) |
| **I need sponsor or sponsor output** | Finalize an architecture package, then export the first-value report and proof packet | Read [Sponsor summary expectations](/help/sponsor-summary) |
| **I need engineering or CLI support** | Run `archlucid doctor` and collect a support bundle | Open in-app help: **CLI usage** (`/help/cli-usage`) or **Configuration reference** (`/help/configuration-reference`) |

**Claim discipline:** Before broadening sales claims, score proof gates **G1–G6** using the [claim readiness status appendix](CLAIM_READINESS_STATUS.md#appendix-gate-passhold-criteria). Stage 0 controlled pilots do not require all gates green; Stage 1 and Stage 2 do — see [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout.

---

## Related

- [`../library/PRODUCT_PACKAGING.md`](../library/PRODUCT_PACKAGING.md)
- [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist)
- [`PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack`](PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack)
