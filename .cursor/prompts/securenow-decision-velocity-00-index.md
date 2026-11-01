<!-- SecureNow decision velocity — Composer prompts.
     Origin: 1 November 2026 desk pass. Decision Velocity 63, weight 2.
     The six-step path and blank pilot decision record are already on master.
     Do not implement from this index. -->

# SecureNow decision velocity — prompt set (SN-DV-01–04)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-DV-01** | `docs/securenow/DECISION_CYCLE_LOG.md` — blank qualify-to-close timer. **Shipped.** |
| 2 | **SN-DV-02** | Sponsor Home row **Decision cycle**. **Shipped.** |
| 3 | **SN-DV-03** | Operator page section that names the stall step and points at the log. **Shipped.** |
| 4 | **SN-DV-04** | Extend the existing warn-only decision-velocity checker. **Shipped.** |
| — | **SN-DV-HOLD** | Stop list. Paste only when a session drifts. |

Run **SN-DV-01**, then **02**, then **03**, then **04**. **SN-DV-HOLD** is not a build step.

Decision Velocity is **63** (weight 2). SN-DV-01–04 are shipped. They aim at about **66** by giving a person a blank cycle timer next to the existing proceed / extend / stop record. A filled synthetic rehearsal is a human task and is what can move the score toward **70**.
