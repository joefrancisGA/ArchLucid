> **Scope:** Paste-ready Composer 2.5 prompts to collect useful Microsoft Defender evidence through the existing Azure extractor and then use it. Prompts only — do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/defender-evidence-00-index.md`](../../.cursor/prompts/defender-evidence-00-index.md)

# Defender evidence — Composer prompts

**Created:** 2026-10-21 · **Status:** ready to paste · **Audience:** Composer 2.5

Today the extractor calls `Microsoft.Security/secureScores` and keeps one percentage per subscription. Path ranking turns that into a Low / Medium / High band and adds the same blast-radius nudge to every path. Assessments, plans, controls, alerts, governance due dates, compliance gaps, attack-path summaries, and vulnerability counts are never stored. The `defender` audit evidence type is hardcoded as unsupported.

Paste **one** numbered file per Composer 2.5 session. Run them in order. Do not implement from this index.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **DFV-01** | [defender-evidence-01-plans.md](../../.cursor/prompts/defender-evidence-01-plans.md) | — | Which Defender plans are on, and a warning when a used resource type is on the Free tier |
| **DFV-02** | [defender-evidence-02-score-controls.md](../../.cursor/prompts/defender-evidence-02-score-controls.md) | — | Secure-score control breakdown. Leave `defender-summary.json` unchanged |
| **DFV-03** | [defender-evidence-03-assessments.md](../../.cursor/prompts/defender-evidence-03-assessments.md) | — | Unhealthy assessments by resource, plus healthy / unhealthy / not-applicable counts |
| **DFV-04** | [defender-evidence-04-governance.md](../../.cursor/prompts/defender-evidence-04-governance.md) | — | Governance owner and remediation due date for assessments |
| **DFV-05** | [defender-evidence-05-compliance.md](../../.cursor/prompts/defender-evidence-05-compliance.md) | — | Regulatory standard totals and failed controls |
| **DFV-06** | [defender-evidence-06-alerts.md](../../.cursor/prompts/defender-evidence-06-alerts.md) | — | Active alert summary joined to a resource id |
| **DFV-07** | [defender-evidence-07-attack-paths.md](../../.cursor/prompts/defender-evidence-07-attack-paths.md) | DFV-01 when pricings already exist | Attack-path id, risk, entry resources, and target resources |
| **DFV-08** | [defender-evidence-08-vulnerability-counts.md](../../.cursor/prompts/defender-evidence-08-vulnerability-counts.md) | — | Per-resource vulnerability counts, plus a capped Critical / High list |
| **DFV-09** | [defender-evidence-09-contacts.md](../../.cursor/prompts/defender-evidence-09-contacts.md) | — | Whether a security contact exists, without storing phone numbers |
| **DFV-10** | [defender-evidence-10-settings.md](../../.cursor/prompts/defender-evidence-10-settings.md) | — | Settings, workspace export, automations, and cloud connectors |
| **DFV-11** | [defender-evidence-11-endpoint-exposure.md](../../.cursor/prompts/defender-evidence-11-endpoint-exposure.md) | — | Defender for Endpoint exposure score when the existing identity can read it |
| **DFV-12** | [defender-evidence-12-use-evidence.md](../../.cursor/prompts/defender-evidence-12-use-evidence.md) | DFV-01–DFV-08 | Path rank, attack-path citation, and the `defender` evidence type use the stored rows |

## Do not pull into these sessions

- A second Azure collector, ZIP schema, or harvest path. ADR 0103 stays the only harvest.
- A Defender attack-path engine, or creating SecureNow paths from Defender attack paths.
- Defender CVE payloads as evidence-graph nodes.
- Raw alert entities, command lines, process trees, remediation scripts, or phone numbers.
- Applying a recommendation or changing any Azure resource.
- A new app registration, client secret, or stored credential.
- Raising the shared `MaxPaginationRequests` used by other ARM readers.
- Bumping `AzureExtractorZipSchema.CurrentVersion`.
