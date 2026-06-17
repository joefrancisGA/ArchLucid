> **Scope:** Repeatable ArchLucid-vs-frontier-AI bakeoff packet — honest comparison only; not a benchmark claim.

# Frontier-AI bakeoff evidence pack

**Audience:** Founder-led demos, pilot debriefs, differentiation conversations.  
**Last reviewed:** 2026-06-16

**Purpose:** Assemble a **repeatable evidence packet** comparing ArchLucid against a principal architect using frontier AI manually on the **same sanitized architecture packet**. Do **not** claim ArchLucid is smarter than frontier AI.

**Canonical protocol:** [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md)

---

## Packet checklist

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

---

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

---

## Scoring rubric (session judgment — not model IQ)

Score each dimension **per session** for ArchLucid vs manual AI. Use **advantage** labels, not winner/loser absolutes.

| Dimension | ArchLucid signal | Manual AI signal | Notes |
| --- | --- | --- | --- |
| Time to sponsor-ready packet | Minutes measured or **unknown** | Minutes measured or **unknown** | Unmeasured = **illustrative only** |
| Evidence traceability | Manifest, audit, citations | Usually manual paste | ArchLucid wins when buyer asks "prove it" |
| Repeatability | Structured re-run | Session-dependent | ArchLucid wins for regulated buyers |
| Governance / audit readiness | Labels, ROI basis, bundle | Ad hoc | ArchLucid wins packaging for procurement |
| Finding usefulness | Session judgment | Session judgment | Record per finding — no superiority claim |
| Sponsor packet quality | First-value / exports | Manual assembly | ArchLucid wins polish time |

Optional insight-validation scales (1–5): novelty, correctness confidence, actionability, surprise, decision impact — see [`BLIND_INSIGHT_VALIDATION_PROTOCOL.md`](Architect_Evaluation/BLIND_INSIGHT_VALIDATION_PROTOCOL.md).

---

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

---

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

---

## Related

- [`COMPETITIVE_LANDSCAPE.md`](COMPETITIVE_LANDSCAPE.md)
- [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md)
- [`BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md`](Architect_Evaluation/BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md)
