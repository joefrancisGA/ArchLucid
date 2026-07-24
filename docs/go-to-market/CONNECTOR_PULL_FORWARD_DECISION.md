> **Scope:** Connector pull-forward decision — hold until market-validated; V1.1 boundaries intact.

# Connector pull-forward decision

**Audience:** Founder / product owner.  
**Last reviewed:** 2026-06-16  
**Decision:** **HOLD** — do not pull V1.1 connectors forward before proof-package value is validated.

---

## Question

Did lack of Jira, ServiceNow, Confluence, Slack, or Teams **block a paid pilot** after ArchLucid produced a valuable architecture package?

---

## Evidence reviewed

| Source | Signal |
| --- | --- |
| [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) | Connectors explicitly V1.1 |
| [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) | Core Pilot does not require connectors |
| [`V1_WORKFLOW_HANDOFF_AZURE_DEVOPS.md`](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md) | Manual handoff acceptable for V1 |
| Assessment 2026-06-16 | No logged paid pilot blocked solely post–review-package |
| [`GTM_BACKLOG.md`](GTM_BACKLOG.md) | Connector demand not proof-gated to Stage 1 yet |

**Pilot notes / support logs (repo):** No documented case where a buyer declined **after** receiving a sponsor-ready packet **only** because connectors were absent.

---

## Conclusion

**Market validation insufficient** to pull connector work ahead of:

1. Blind principal-architect validation cohort (insight density)
2. Three real-mode proof runs (claim readiness)
3. Paid service-led review offer tests (commercial signal)

**Workflow handoff pain** may exist anecdotally — capture in paid pilot retros with explicit quote: *"Would you have paid if Jira sync existed?"*

---

## Revisit triggers

Pull forward **only** when **≥2** of:

- Paid pilot retro records connector as **primary** blocker (not procurement/SOC)
- Buyer signs SOW contingent on specific connector with dated deadline
- Second-review validation shows manual handoff dominates operator time (>30% session)

---

## Action

- [ ] **No engineering pull-forward**
- [ ] Log connector asks in pilot CRM with `deferred-scope` tag
- [ ] Reassess after [`BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md`](Architect_Evaluation/BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md) cohort completes

**V1.1 scope unchanged** — see [`WHAT_NOT_TO_PROMISE.md`](WHAT_NOT_TO_PROMISE.md).
