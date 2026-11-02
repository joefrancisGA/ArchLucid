<!-- SecureNow decision velocity — Composer prompts.
     Origin: 1 November 2026 desk pass. Decision Velocity 63, weight 2.
     The six-step path and blank pilot decision record are already on master.
     Do not implement from this index. -->

# SecureNow decision velocity — prompt set (SN-DV-01–06)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-DV-01** | `docs/securenow/DECISION_CYCLE_LOG.md` — blank qualify-to-close timer. **Shipped.** |
| 2 | **SN-DV-02** | Sponsor Home row **Decision cycle**. **Shipped.** |
| 3 | **SN-DV-03** | Operator page section that names the stall step and points at the log. **Shipped.** |
| 4 | **SN-DV-04** | Extend the existing warn-only decision-velocity checker. **Shipped.** |
| 5 | **SN-DV-05** | Each stall step links to an existing surface. The source log stays blank. |
| 6 | **SN-DV-06** | Checker requires the six hrefs and a blank source log. |
| — | **SN-DV-HOLD** | Stop list. Paste only when a session drifts. |

**SN-DV-01** through **SN-DV-04** are on trunk. Do not redo them. Run **SN-DV-05**, then **06**. **SN-DV-HOLD** is not a build step.

Decision Velocity is **66** (weight 2). The filled synthetic rehearsal is **M-314** and is what can move the score toward **70**.
