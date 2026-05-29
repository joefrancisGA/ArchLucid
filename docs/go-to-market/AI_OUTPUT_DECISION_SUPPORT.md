> **Scope:** Buyer-facing explanation of ArchLucid AI output limits — not legal advice or formal verification.

# AI output is decision support

**Audience:** Sponsors, procurement, and security reviewers evaluating ArchLucid outputs.

ArchLucid uses AI to accelerate architecture review. **AI-generated text is decision support.** Your team approves final decisions using persisted evidence, not model prose alone.

## What you can rely on

| Evidence type | Role |
| --- | --- |
| Committed golden manifest | Frozen review package identity and timestamps |
| Findings and severity | Structured outputs tied to evidence references |
| Execution traces and audit rows | Durable, exportable activity with correlation ids |
| Evidence-chain pointers | Links from findings back to snapshots and manifests |
| Governance records | Policy packs, approvals, and pre-commit gates when enabled |

## What requires human judgment

- Whether a recommendation fits your organizational standards
- Whether projected ROI or cycle-time savings apply to your estate
- Whether demo or simulator runs represent customer outcomes

## Evidence-basis labels (on exports)

Sponsor and operator surfaces use shared labels from [`../library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md):

| Label | Meaning |
| --- | --- |
| **Evidence-backed** | Persisted citations or complete proof fields support the narrative |
| **Estimate** | Fallback ROI, defaulted baselines, or heuristic context |
| **Low support** | Faithfulness or PilotStrict evidence below sponsor-safe threshold |
| **Demo-derived** | Sample/demo workspace — illustrative only |
| **Manual review required** | Incomplete evidence or simulator substitution must be disclosed |
| **Deferred scope** | Buyer ask is outside current V1 readiness |

These labels describe **product evidence posture**, not legal, compliance, or audit attestation.

## Limits we do not claim

- Formal verification of AI recommendations
- Guaranteed correctness in all enterprise contexts
- SOC 2 CPA attestation or completed third-party penetration testing (see [`TRUST_CENTER.md`](TRUST_CENTER.md))

## Deeper technical evidence

- [`../library/AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md) — Limits of AI explanations
- [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)
