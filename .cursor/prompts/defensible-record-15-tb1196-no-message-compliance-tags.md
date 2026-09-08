# DR-15 — Do not lift ComplianceTags from agent Message (TB-1196 leftover)

**Do not treat agent overlay as sealed.** **Do not fork DR-02** — withheld band may display quarantined tags; this prompt is the **merge rule**.

## Goal

Close the **TB-1196** leftover: governance merge must not add `ComplianceTags` by parsing agent finding `Message` prose (`AgentProposalManifestMerger.Governance.cs`). Tags come from typed emission / pack evaluation only. Prose-only tag candidates are quarantined (log + DR-02 withheld reason `compliance-tag-from-prose`) and never appear as authoritative pack hits on the stamp.

Update `DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md` / Real-variance isolation contract “Today” column.

## Why

A livelihood-critical compliance chip sourced from LLM prose is a false attestation. R4 requires asserted vs inferred; pack tags are asserted only when a pack rule produced them.

## Context

- `AgentProposalManifestMerger.Governance.cs`
- `AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md`
- `DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md` TB-1196
- Bundled policy pack evaluation (existing typed path)

## What to build

1. Remove or quarantine the message-text lift; one class per file if you extract a policy.
2. Tests: message contains “SOC 2” → no ComplianceTag unless typed emission had it.
3. Contract markdown: Today = closed for this lift.
4. Do not add a 40th engine to “make up” tags.

## Acceptance criteria

- A reviewer can grep the merger and not find tag assignment from `Message`.
- Existing typed tags still merge.

## Constraints

- Public claim boundary. No fake transcripts. Scoped compile.
