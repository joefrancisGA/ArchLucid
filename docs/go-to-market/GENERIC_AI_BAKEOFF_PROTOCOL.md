> **Reviewed:** 2026-07-25

> **Scope:** Repeatable comparison protocol — ArchLucid vs a principal architect using frontier AI manually. Includes the evidence-pack checklist, prompt, and summary templates. Not a competitive benchmark claim.

# Generic-AI bakeoff protocol

**Audience:** Founder-led demos, pilot debriefs, and differentiation conversations.  
**Last reviewed:** 2026-07-25

**End-to-end runbook (five steps):** [`../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md)  
**Session folder template:** [`fixtures/bakeoff/session-template/README.md`](../../fixtures/bakeoff/session-template/README.md)  
**Rolling scoreboard:** [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md)

## What this compares

The realistic alternative is **not** only LeanIX or Ardoq. It is a **competent principal architect using frontier AI manually** (Claude Opus, GPT-5 / ChatGPT, Gemini Pro, or Cursor with a strong model) on the same architecture packet.

ArchLucid does **not** always reason better than frontier AI. This protocol documents **where each wins honestly**.

## Setup

| Input | Requirement |
| --- | --- |
| Architecture packet | Same sanitized packet for both paths |
| ArchLucid path | Committed review with labeled execution mode |
| Manual AI path | Principal-architect prompt; save transcript + findings list |
| Time box | 60–90 minutes total prep; record wall-clock where measured |

## Comparison rubric

| Dimension | ArchLucid | Manual frontier AI | Notes |
| --- | --- | --- | --- |
| Time to first sponsor-ready packet | Measured or estimated | Measured or estimated | Label unmeasured times **illustrative** |
| Evidence traceability | Manifest, audit, citations | Usually absent unless manually pasted | ArchLucid advantage when buyer asks "prove it" |
| Repeatability | Same inputs → structured re-run | Depends on prompt/session | ArchLucid advantage for regulated buyers |
| Governance / audit readiness | Labels, ROI basis, export bundle | Ad hoc | ArchLucid advantage |
| Finding breadth / flexibility | Pipeline-bound | Often broader ad hoc | Manual AI may win on exploratory breadth |
| Setup friction | Pilot config, tenant, proof collection | Near zero | Manual AI wins first session |
| Sponsor packet polish | First-value report, PDF/DOCX | Manual assembly | ArchLucid wins packaging time |
| Cost of wrong finding | Evidence trail + rollback narrative | Reputation risk | Tie — both need human review |

## Where manual frontier AI wins

- Zero platform setup for a one-off review
- Broad domain questions outside finalized architecture package scope
- Rapid what-if brainstorming without governance overhead
- Custom narrative tone without export templates

## Where ArchLucid wins (V1_SCOPE capabilities)

- Durable architecture package + finalized review lifecycle
- Audit trail and correlation IDs
- Provenance graph and evidence-linked findings
- Repeatable proof packet for procurement
- Policy-consistent exports with execution-mode labels
- ROI basis discipline and sponsor-safe fallbacks

## Demo script (15-minute executive slice)

1. Show manual AI findings list — 2 minutes.
2. Show ArchLucid sponsor packet with **execution mode** and **evidence-basis** labels — 5 minutes.
3. Open audit / evidence trail for one finding — 3 minutes.
4. State honestly: "Manual AI may find issues faster on day one; ArchLucid packages defensible evidence faster on day two and every review after." — 2 minutes.
5. Q&A — defer CPA SOC 2 / pen test / marketplace to deferred-scope slide.

## Anti-patterns (do not claim)

- "ArchLucid is smarter than GPT-5" (unprovable, fragile)
- Invented benchmark percentages without measured sessions
- Simulator output presented as live customer proof
- Competitor product slurs (LeanIX/Ardoq are different category)

## Evidence that should update positioning

| Signal | Action |
| --- | --- |
| ArchLucid N-rate ≥25% in insight validation | Strengthen "non-obvious findings" narrative |
| Manual AI consistently faster to first draft | Lead with packaging / audit / repeatability |
| Faithfulness failures on real packet | Narrow AI claims; engineering priority |

## Evidence pack checklist

| # | Item | Status |
| --- | --- | --- |
| 1 | Sanitized architecture packet (same for both arms) | ☐ |
| 2 | ArchLucid committed run id + execution mode label | ☐ |
| 3 | ArchLucid sponsor export (first-value Markdown or proof ZIP) | ☐ |
| 4 | Manual AI findings list (not raw chat dump) | ☐ |
| 5 | Manual AI prompt saved | ☐ |
| 6 | Wall-clock times recorded or labeled **unknown** | ☐ |
| 7 | Session notes (honest wins/losses) | ☐ |
| 8 | Anti-claim review (no "smarter than GPT" language) | ☐ |
| 9 | Generated summary JSON + Markdown | ☐ |

## Manual frontier-AI prompt (copy/adapt)

Use the same packet as ArchLucid. Save the prompt with the session.

```text
You are a principal cloud architect reviewing an architecture packet for a regulated enterprise buyer.

Inputs:
- Architecture packet: [attach sanitized brief + manifest excerpt]
- Buyer context: [industry, compliance drivers — no PII]

Tasks:
1. List the top 10 material architecture findings (severity + one-line rationale each).
2. For each finding, cite which packet section or artifact supports it.
3. Recommend three decision changes the ARB should consider before approval.
4. Draft a 150-word executive summary suitable for a CIO — label any estimate as an estimate.

Constraints:
- Do not invent infrastructure not present in the packet.
- Flag uncertainty explicitly.
- Output a numbered findings list only (no marketing language).
```

**Baseline prompt file:** [`fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt`](../../fixtures/blind-validation/regulated-scenario/manual-ai-baseline-prompt.txt)

## Blind comparison of findings

After manual and ArchLucid arms complete, run blind scoring so reviewers do not know which arm is which.

**Protocol:** [`Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation)

```powershell
# Demo / internal dry-run on regulated fixture
.\scripts\Run-BlindInsightValidation.ps1 -SessionLabel <label> -NonInteractiveScore -AutoSummarize

# Live session — see runbook Step 3 for fixture layout under artifacts/bakeoff/<label>/
python scripts/assemble_blind_validation_packet.py assemble `
  --fixture artifacts/bakeoff/<label> `
  --output artifacts/bakeoff/<label>/blind `
  --session-id <label>
```

**Facilitator only:** `source-key.json` — do not share until scoring completes.

## Decision-delta scoring

Within 7 days, complete [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) and save to `artifacts/bakeoff/<label>/decision-delta.md` (template: [`fixtures/bakeoff/session-template/decision-delta.template.md`](../../fixtures/bakeoff/session-template/decision-delta.template.md)).

| Outcome | Criteria |
| --- | --- |
| **PASS** | ≥1 documented decision change from an ArchLucid finding not in the manual AI pass |
| **WARN** | Confirmatory only — packaging/audit value |
| **FAIL** | Participant would not run review #2 |

## Generate summary artifacts

From repository root after packet folder is prepared:

```powershell
python scripts/ci/build_generic_ai_bakeoff_summary.py `
  --archlucid-packet-dir artifacts/bakeoff/<session>/archlucid `
  --manual-ai-findings artifacts/bakeoff/<session>/manual-findings.md `
  --archlucid-minutes 42 `
  --manual-minutes 35 `
  --session-notes "Manual timing self-reported; ArchLucid includes commit + export." `
  --json-out artifacts/bakeoff/<session>/bakeoff-summary.json `
  --markdown-out artifacts/bakeoff/<session>/bakeoff-summary.md
```

**Required `archlucid/packet-metadata.json` fields:**

```json
{
  "runId": "<guid>",
  "executionMode": "Real"
}
```

Omit `--archlucid-minutes` / `--manual-minutes` when not measured — summary will label **unknown / not measured**.

## Summary template (facilitator rollup)

```markdown
# Bakeoff session summary — <label>

**Date (UTC):**  
**Packet:**  
**ArchLucid execution mode:**  
**Evidence basis:**  

## Timing (honest)

| Path | Minutes | Basis |
| --- | --- | --- |
| ArchLucid | | measured / unknown |
| Manual frontier AI | | measured / unknown |

## Dimension notes

- Time to sponsor packet:  
- Evidence traceability:  
- Repeatability:  
- Governance readiness:  
- Finding usefulness:  
- Sponsor packet quality:  

## Where manual frontier AI won

- 

## Where ArchLucid won

- 

## Anti-claims confirmed

- [ ] Did not claim ArchLucid is smarter than frontier AI
- [ ] Did not present simulator as live proof
- [ ] Did not invent benchmark percentages

## Decision

- [ ] Strengthen repeatability / evidence narrative  
- [ ] Narrow AI reasoning claims  
- [ ] Engineering follow-up for faithfulness gap  
```

## Related

- [`../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md`](../runbooks/PRINCIPAL_ARCHITECT_FRONTIER_AI_BAKEOFF.md) — end-to-end five-step bakeoff runbook
- [`FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md) — rolling scoreboard (**Done 2026-06-17**)
- [`PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md#blind-insight-validation) — blind packet assembly + cohort checklist
- [`DECISION_DELTA_INTERVIEW.md`](DECISION_DELTA_INTERVIEW.md) — post-bakeoff decision scoring
- [`PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md`](PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md) — randomized two-arm dismissal interview (30-day reuse + pay-to-avoid)
- [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`V1_SCOPE.md`](../library/V1_SCOPE.md)
