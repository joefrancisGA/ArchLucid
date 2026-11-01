<!-- SecureNow cutting-edge AI — Composer prompts.
     Origin: 31 October 2026 desk pass, refreshed on origin/master.
     Cutting-Edge AI Technology 62, weight 8, weighted deficiency 304.
     Do not implement from this index. -->

# SecureNow cutting-edge AI — prompt set (SN-CE-01–04)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-CE-01** | `RankedPath` Ask topic, selected only when `SecurityEvidencePathId` is set. |
| 2 | **SN-CE-02** | Ask bundle of the stored path, hops, rank row, and cut point. |
| 3 | **SN-CE-03** | Grounded JSON answer that cites that bundle and refuses a new sort or a numeric likelihood. |
| 4 | **SN-CE-04** | Fixture question, recorded completion, warn-only checker. |
| — | **SN-CE-HOLD** | Stop list. Paste only when a session drifts. |

Run **SN-CE-01**, then **02**, then **03**, then **04**. **SN-CE-HOLD** is not a build step.

Cutting-Edge AI Technology is **62** (weight 8). These prompts aim at about **70** by letting Ask explain one stored ranked path. They leave the ranker, the 50-row cap, and the existing path-explanation button alone. AI/Agent Readiness stays a separate score.
