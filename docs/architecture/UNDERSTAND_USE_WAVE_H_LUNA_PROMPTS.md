> **Scope:** Paste-ready GPT-5.6 Luna prompt for taking sort keys off the attack path report and the wave list. Internal engineering only.
> **Paste-ready file:** [`.cursor/prompts/understand-use-67-sort-key-off-the-report.md`](../../.cursor/prompts/understand-use-67-sort-key-off-the-report.md)

# Understand and use, wave H — report and waves

**Created:** 2026-10-18 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index. Wave G is [`UNDERSTAND_USE_WAVE_G_LUNA_PROMPTS.md`](UNDERSTAND_USE_WAVE_G_LUNA_PROMPTS.md).

The attack path report and a remediation wave are what a reviewer reads. The four-decimal sort key only orders an operator queue. This session removes it from those two readings. It does not change the score, the weights, or wave membership.

| ID | Prompt | Intent |
|----|--------|--------|
| **UU-67** | [understand-use-67-sort-key-off-the-report.md](../../.cursor/prompts/understand-use-67-sort-key-off-the-report.md) | The report and the wave list do not show a sort key |

**UU-67** keeps the UU-31 and UU-62 disclosures on the operator queues.

## Do not pull into this session

- Hiding review workspace tabs, or moving a primary tab into More
- Deleting `formatRemediationPrioritySortKeyLine` or `formatSecurityEvidencePathCompositeSortKeyLine`
- A new metric, a new weight, a percentage, or a second score formula
- Creating, assigning, or resizing a remediation wave
- Azure write APIs, terraform apply, or a new collector
- Renaming `RemediationRiskFactor`, disposition enums, `PathKind`, `ProvenanceKind`, or `PathConfidenceBand`
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**

This wave stops at **UU-67**.
