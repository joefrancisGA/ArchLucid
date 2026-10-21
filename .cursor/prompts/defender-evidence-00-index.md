<!-- Defender evidence — Composer prompts.
     Origin: 2026-10-21 owner ask. The extractor kept one secure-score
     percentage and did not use assessments, plans, controls, alerts,
     governance, compliance, attack-path summaries, or vulnerability counts.
     Do not implement from this index. -->

# Defender evidence — Composer prompt set (DFV-01–DFV-12)

Paste **one** numbered file per Composer 2.5 session, in order.

Copy-paste docs index: [`docs/architecture/DEFENDER_EVIDENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/DEFENDER_EVIDENCE_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **DFV-01** | Defender plan tier per subscription, and a Free-tier warning when that plan's resource type is in inventory |
| 2 | **DFV-02** | Secure-score controls. `defender-summary.json` stays one percentage |
| 3 | **DFV-03** | Unhealthy assessments on a resource id, plus status counts |
| 4 | **DFV-04** | Governance owner and remediation due date |
| 5 | **DFV-05** | Regulatory standard totals and failed controls |
| 6 | **DFV-06** | Active alerts joined to a resource id |
| 7 | **DFV-07** | Attack-path summary rows. No new paths |
| 8 | **DFV-08** | Vulnerability counts per resource, and a capped Critical / High list |
| 9 | **DFV-09** | Security contact presence. No phone numbers |
| 10 | **DFV-10** | Settings, workspace export, automations, and connectors |
| 11 | **DFV-11** | Endpoint exposure score only when the current identity can already read it |
| 12 | **DFV-12** | Path rank and the `defender` evidence type read the stored rows |

Do not add a second collector. Do not build a Defender attack-path engine.
