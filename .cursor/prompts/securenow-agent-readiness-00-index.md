<!-- SecureNow AI/Agent Readiness — Composer prompts.
     Origin: 1 November 2026 desk pass at origin/master aaf0c3ad64.
     AI/Agent Readiness 66, weight 8, weighted deficiency 272.
     Do not implement from this index. -->

# SecureNow AI/Agent Readiness — prompt set (SN-AIR-01–04)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-AIR-01** | Path inspect calls live explanation only when agent execution mode is Real, and labels model versus simulator. |
| 2 | **SN-AIR-02** | A rejected or failed model completion persists the deterministic stored-path summary and the rejection reason. |
| 3 | **SN-AIR-03** | This explanation and `RankedPath` Ask use an 800-token cap. The panel states how many citations grounded the answer. |
| 4 | **SN-AIR-04** | Recorded completions and a warn-only checker. |
| — | **SN-AIR-HOLD** | Stop list. Paste only when a session drifts. |

Run **SN-AIR-01**, then **02**, then **03**, then **04**. **SN-AIR-HOLD** is not a build step.

AI/Agent Readiness is **66** (weight 8). These prompts aim at about **72**. They leave `PathRankingEngine` and the citation allow-list alone. The owner walk is **M-313**. Do not run that walk in an implementation session.
