# Solo-operator pages versus support email (TB-989)

**Audience:** Founder / solo operator, support triage, principal-architect diligence  
**Backlog:** [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) **TB-989** (this contract) · **TB-990** (triage enrichment) · **TB-991** (honesty CI)  
**GTM:** [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **M-119** / **M-142** / **M-143**  
**Enablement SoT:** [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](SOLO_OPERATOR_MVO_OBSERVABILITY.md) (**TB-957** Done)

> **Not** a buyer assurance attestation. Does not invent a second SRE stack or 24×7 NOC.

---

## Decision in one line

**Critical fleet MVO P0s page the founder when the scrape + critical action group + owner Portal Test path is enabled (**M-120**).** Warn/SLO/agent-output signals are **ops email-only**. In-product **Report Problem** is **support inbox by design** (**TB-788**). **TB-958** / **TB-959** add cardinality-safe stuck-run P0 and a review-path canary — engineering **Done**; owner enablement and **M-120** proof still gate production paging claims.

**Buyer / PA handout:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#solo-operator-pages-vs-support-email-m-143) (GTM **M-143**).

---

## Coverage decision matrix

| Failure / signal class | Destination when configured | Pages founder before customer ticket? | What it proves |
| --- | --- | --- | --- |
| **Fleet MVO P0** (API down, health Unhealthy, SQL connect failures, OpenAI circuit open, authority dead letters, trial signup failure rate) | **Critical action group** (`azurerm_monitor_action_group.critical`) | **Yes** — for these fleet-wide conditions only, when enabled + **M-120** verified | Platform-wide outage or shared dependency failure |
| **Stale in-flight runs** (`ArchLucidStaleInFlightRunsTf`, **TB-958** Done) | **Critical action group** | **Partial** — fleet gauge pages; tenant/run id in **logs** for triage (no unbounded `tenant_id` Prom labels) | Stuck-run degradation while fleet gauges may still look green for other tenants |
| **Review-path canary** (`.github/workflows/review-path-canary.yml`, **TB-959** Done) | PagerDuty / critical webhook when enabled | **Yes** — when `ARCHLUCID_REVIEW_PATH_CANARY_ENABLED=true` + paging secret | Private-tenant create→execute→commit journey — not auth/showcase alone |
| **Warn / SLO / agent-output** Prometheus groups | **Ops action group** (email-only) | **No** | Notification for later review — not MVO page path |
| **Report Problem** (`POST /v1/support/problem-reports`, **TB-788**) | `Email:SupportInbox` | **No** — customer-initiated by design | Support intake; next-business-day SLA (**TB-789**) |
| **Auth / showcase synthetics** (**TB-758** / **TB-889**) | Ops / synthetic channels | **No** — not substitutes for review journey | Login / marketing path — not create→execute→finalize |
| **Single-tenant UX / config / user error** without firing rows above | Support email / operator reply | **No** — expected support path until classified | Product defect or tenant-specific issue — triage per **TB-990** |

---

## Prerequisite honesty

| Do promise | Do not promise |
| --- | --- |
| Documented P0 set and how to enable paging (**TB-957**) | That Terraform/YAML in git means production pages today |
| Founder can verify AMW scrape + action-group Test (**M-120**) | Full multi-on-call SRE tooling |
| Report Problem routes to support inbox by design | That every tenant failure pages before a customer ticket |
| **TB-958** / **TB-959** engineering is Done with owner checklists | That stale-run P0 or review-path canary page until env flags + secrets are set |

---

## PA decision questions

1. Which failure classes **page** (critical AG) vs **ops email-only** vs **support inbox**?
2. Was the **M-120** page-path drill passed for this environment?
3. When a Report Problem arrives, were **fleet MVO P0s quiet** in the report window? (**TB-990** triage step)
4. Is the failure **fleet-wide**, **tenant-specific with stuck-run signal**, **canary miss**, or **customer-reported / config**?

---

## Approved vs forbidden wording

**Approved (example):** “Critical fleet conditions page the operator when the MVO path is enabled and verified. Some warnings route through operations email. Report Problem is support inbox by design. Stuck-run and review-path canary coverage require owner enablement — see **TB-958** / **TB-959** checklists.”

**Forbidden:**

- “We page on every customer-impacting failure.”
- “Support email is proactive detection.”
- “MVO in place” without scrape + critical AG + **M-120** log.
- “Per-tenant paging is live” without **TB-958** Terraform apply + metric scrape proof.
- “Review-path canary always pages” without opt-in env + paging secret (**TB-959**).

---

## Triage hook (**TB-990**)

When **Report Problem** arrives, before treating it as novel:

1. Classify per this matrix: fleet P0 should have fired vs expected support-path intake.
2. Follow [`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](../runbooks/SUPPORT_PROBLEM_REPORT_TRIAGE.md) — structured MVO quiet/firing checklist ships in **TB-990**.

---

## CI anchors (**TB-991**)

Honesty guard: `scripts/ci/check_solo_ops_mvo_honesty.py` — retains anchors in [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](SOLO_OPERATOR_MVO_OBSERVABILITY.md), forbids over-strong paging copy while single-tenant gap rows were open, and asserts P0 Terraform rules route to `azurerm_monitor_action_group.critical` (not `ops`). Wired in `run_buyer_surface_strict_guards.py`.

---

## Related

- MVO enablement + P0 catalog: [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](SOLO_OPERATOR_MVO_OBSERVABILITY.md)
- Stuck-run runbook: [`STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md) (**TB-958**)
- Review-path canary: [`REVIEW_PATH_CANARY.md`](../runbooks/REVIEW_PATH_CANARY.md) (**TB-959**)
- Support triage: [`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](../runbooks/SUPPORT_PROBLEM_REPORT_TRIAGE.md) (**TB-792**)
- Metrics catalog: [`OBSERVABILITY.md`](../library/OBSERVABILITY.md)
- Claim boundary: [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (**M-119** / **M-142**)
