> **Scope:** Market validation protocol — tests whether experienced architects find ArchLucid outputs non-obvious and decision-changing. Not a product spec.

# Principal-architect insight validation protocol

**Audience:** Founder / release owner running live demos or paid pilots.  
**Duration:** 30–45 minutes per session.  
**Last reviewed:** 2026-06-14

## Purpose

Answer the highest-value market question: **Do principal architects find ArchLucid outputs non-obvious, correct, and worth repeating after the demo novelty wears off?**

This is validation work — not a substitute for shipping pilot proof mechanics.

## Participant profile

- **Title:** Principal / lead / staff architect, cloud architect, or CTO with hands-on architecture review experience (≥8 years).
- **Exclude:** ArchLucid builders, paid advocates, and participants who cannot critique AI output honestly.
- **Ideal count:** 3–5 sessions before changing roadmap messaging.

## Materials (prepare before session)

| Item | Source |
| --- | --- |
| Sanitized architecture packet (8–15 pages) | Customer redacted packet or Contoso-style sample |
| ArchLucid committed review output | Real-mode preferred; simulator OK if labeled |
| Frontier-AI manual baseline | Same packet reviewed in Claude Opus / GPT-5 / Gemini Pro with principal-architect prompt |
| Scoring sheet | [`PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`](PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md) (print or shared doc) |

**Frontier-AI baseline prompt (manual comparison):**

```text
You are a principal cloud architect reviewing this architecture for security, cost, reliability, and operability.
List findings by severity. Cite assumptions. Do not invent infrastructure that is not in the packet.
```

## Session flow

| Minute | Activity |
| --- | --- |
| 0–5 | Context only — no product pitch. State that simulator vs real-mode labels matter. |
| 5–10 | Participant reads packet cold; notes top 3 concerns without tools. |
| 10–25 | Walk through ArchLucid sponsor packet (findings + evidence trail). Observer silent. |
| 25–35 | Same packet: show what frontier AI produced manually (or participant did pre-session). |
| 35–45 | Scoring interview (questions below). |

## Observation questions

1. Which ArchLucid finding would you **not** have written yourself in the first pass?
2. Which finding was **wrong or unsupported** by the packet?
3. Where is the **evidence trail** stronger than manual AI output?
4. Would you **reuse** ArchLucid for the next review cycle? Why or why not?
5. What would make you **stop** using it after two reviews?

## Scoring rubric

Rate each material finding (ArchLucid and manual AI separately):

| Code | Label | Definition |
| --- | --- | --- |
| **O** | Obvious | Competent architect would likely state this without AI |
| **U** | Useful but expected | Correct and helpful, not surprising |
| **N** | Non-obvious and correct | Participant did not expect it; validates against packet |
| **X** | Incorrect | Factually wrong, hallucinated, or misapplied |
| **S** | Unsupported | Plausible but lacks evidence / citation for sponsor use |

**Session pass thresholds (conservative):**

| Metric | Pass | Fail |
| --- | --- | --- |
| Non-obvious+correct (N) share of material findings | ≥25% | <15% |
| Incorrect (X) findings | 0 critical, ≤1 minor | Any critical X |
| Participant reuse intent | ≥3/5 would reuse | ≤2/5 would reuse |

## Comparison dimensions (ArchLucid vs manual frontier AI)

| Dimension | What to observe |
| --- | --- |
| Time to first reviewable packet | Wall clock; label estimates as illustrative unless measured |
| Evidence traceability | Citations, manifest linkage, audit rows |
| Repeatability | Same packet → comparable output |
| Governance / audit readiness | Export labels, execution mode, ROI basis |
| Finding usefulness | N vs O ratio |
| Sponsor packet quality | Would participant send to executive sponsor? |

## What changes roadmap or messaging

| Outcome | Action |
| --- | --- |
| Pass on N-rate and reuse | Advance insight-density narrative; keep proof-gated GTM |
| Fail on N-rate | Do **not** broaden claims; run more pilots before collateral |
| Fail on X findings | Engineering priority on faithfulness / retrieval — not new surfaces |
| Manual AI wins on flexibility | Emphasize durability, audit, repeatability in positioning |

## Related

- [`PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md`](PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md)
- [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)
- [`GENERIC_AI_BAKEOFF_PROTOCOL.md`](GENERIC_AI_BAKEOFF_PROTOCOL.md)
- [`GTM_BACKLOG.md`](GTM_BACKLOG.md) § Proof-gated rollout
