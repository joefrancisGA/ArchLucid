> **Scope:** Customer-facing — architecture findings orientation (in-app help). API and integration detail lives in developer documentation.

# Findings

Understand architecture risks, inspect supporting evidence, and decide how each finding should be addressed.

A finding is an evidence-backed architecture concern identified during a review. Findings describe the observed issue, its severity, the affected area, supporting evidence, and recommended action. Depending on your role, you may investigate, assign, remediate, accept, waive, or escalate a finding.

## What a finding is {#what-a-finding-is}

During a review, ArchLucid compares architecture evidence against active policies and standards. When a gap or risk is detected, the product records a finding with severity, impact, and recommended action.

## Anatomy of a finding {#anatomy-of-a-finding}

Each finding includes title, severity, status, affected domain, business impact, evidence, recommendation, owner, and governance disposition. Finding rows also show **origin × grounding** chips so reviewers know how the finding was produced and how well evidence supports it.

## Where findings come from {#where-findings-come-from}

Every finding is labeled by **origin** so a reviewer signing off can answer: did a deterministic policy rule fire, or did a language model produce this? Deterministic-rule findings carry the rule's rationale. AI-generated findings carry evidence references and a **grounding** label (evidence-backed, estimated, ungrounded, or degraded). Simulated findings are labeled and must not be cited as live-model output.

| Axis | What it answers | Values reviewers see |
|------|-----------------|----------------------|
| **Origin** | Who produced the finding? | Deterministic rule · AI-generated · Simulated |
| **Grounding** | How well is the conclusion supported? | Evidence-backed · Estimated · Ungrounded · Degraded · Not applicable (for rule/simulator origins) |

Origin is the primary badge next to severity on finding rows. Grounding appears as secondary text on the same chip.

- **Deterministic rule** — A policy pack rule evaluated the evidence and fired. The rationale comes from the rule definition, not from a model.
- **AI-generated** — A language model produced the finding. Always read the grounding label and linked evidence before defending the finding in a design authority meeting.
- **Simulated** — Produced by the deterministic simulator (not a live model). Structurally valid for demos and dry-runs; not real-model evidence.

Provenance labeling describes **how** a finding was produced and whether evidence is attached. It does **not** claim accuracy rates, production validation, or that AI-generated findings are independently verified. Reviewers remain accountable for disposition decisions.

## Severity and impact {#severity-and-impact}

Severity reflects urgency. Critical, Error, Warning, and Info levels align with the product severity model.

## Inspect the evidence {#inspect-the-evidence}

Review source evidence, the evaluated rule, reasoning, affected elements, confidence, and related decisions from the finding detail view.

## Respond to a finding {#respond-to-a-finding}

Authorized users can assign owners, record dispositions, request exceptions, and mark findings resolved when remediation is complete.

## Findings and governance {#findings-and-governance}

Findings influence review readiness, may require approval or exception, and appear in governance reporting and the audit trail.

## Role guidance {#role-guidance}

Solution architects investigate and assign remediation. Reviewers validate evidence and severity. Governance leads record decisions. Executives review material risk.

## Related guides {#related-guides}

- [Review guide](/help/review-guide) — start a review and confirm review scope in the wizard.
- [Evidence graph](/help/evidence-trail) — trace a finding back to source artifacts.
- [Architecture packages](/help/review-packages) — open and export completed packages.
