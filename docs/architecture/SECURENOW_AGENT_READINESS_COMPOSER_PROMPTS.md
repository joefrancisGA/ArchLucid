> **Scope:** Paste-ready Composer prompts for SecureNow AI/Agent Readiness. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-agent-readiness-00-index.md`](../../.cursor/prompts/securenow-agent-readiness-00-index.md)

# SecureNow AI/Agent Readiness — Composer prompts

**Created:** 2026-11-01 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

AI/Agent Readiness scored **66** on the 1 November 2026 desk pass (weight 8, weighted deficiency 272) at `origin/master` `aaf0c3ad64`. Path inspect always posts `useSimulator: true`. The live explanation in `SecurityEvidencePathExplanationService` already redacts, requests JSON, and rejects citations or ARM ids outside the stored path. A rejected model answer is a hard error, and `CompleteJsonAsync` is called with `maxTokens: null`.

These prompts aim at about **72**. That is a labeled live or simulator explanation, a fallback to the stored-path summary, and a token cap on this call and on `RankedPath` Ask. It is not a new ranker and not a numeric likelihood. The owner walk that can support about **74** is **M-313** in [`docs/go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md). Do not perform that walk in these sessions.

**TB-178** and **TB-180**–**TB-195** stay Done. Do not reopen them here. **SN-CE-HOLD** still forbids replacing the explanation button during a cutting-edge session. This wave is the later increment that labels a live call.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-AIR-01** | `securenow-agent-readiness-01-explanation-mode.md` | Path inspect follows `useAgentExecutionMode` and shows model or simulator |
| **SN-AIR-02** | `securenow-agent-readiness-02-stored-path-fallback.md` | Rejected or failed model output persists the deterministic summary |
| **SN-AIR-03** | `securenow-agent-readiness-03-token-cap.md` | 800-token cap and a grounding line |
| **SN-AIR-04** | `securenow-agent-readiness-04-fixture-and-checker.md` | Recorded completions and a warn-only checker |
| **SN-AIR-HOLD** | `securenow-agent-readiness-hold.md` | Stop list |

Run **SN-AIR-01**, then **02**, then **03**, then **04**. **SN-AIR-HOLD** is not a build step.
