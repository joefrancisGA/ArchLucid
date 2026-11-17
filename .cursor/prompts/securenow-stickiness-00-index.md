<!-- SecureNow stickiness — Composer prompts.
     Origin: 2026-10-31 desk pass. SecureNow stickiness score 58, weight 1.
     Do not implement from this index. -->

# SecureNow stickiness — prompt set (SN-STICK-01–04)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-STICK-01** | Return-reason note. Four existing reasons to reopen SecureNow. |
| 2 | **SN-STICK-02** | SecureNow Home section that links those reasons. |
| 3 | **SN-STICK-03** | Operator page that explains when to come back. |
| 4 | **SN-STICK-04** | Warn-only checker for the note, Home links, and operator page. |
| — | **SN-STICK-HOLD** | Stop list. Paste only when a session drifts. |

Run **SN-STICK-01**, then **02**, then **03**, then **04**. **SN-STICK-HOLD** is not a build step.
