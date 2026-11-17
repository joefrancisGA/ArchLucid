> **Scope:** Paste-ready Composer prompts for the next SecureNow decision-velocity increment. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-decision-velocity-00-index.md`](../../.cursor/prompts/securenow-decision-velocity-00-index.md)

# SecureNow decision velocity — Composer prompts

**Created:** 2026-11-01 · **Updated:** 2026-11-01 · **Status:** SN-DV-01–04 shipped. SN-DV-05–06 are the follow-on. **Audience:** Composer 2.5 slow (`composer-2.5`)

Decision Velocity is **66** (weight 2). SN-DV-01–04 shipped the blank qualify-to-close log, the sponsor Home row, the operator stall list, and the checker. SN-DV-05–06 point each stall name at a surface that already exists. They leave the source log blank. A person filling one `SYNTHETIC FIXTURE` row, with real start and close times and one stall step, is **M-314** and is the human work that can move the score toward **70**.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-DV-01** | `securenow-decision-velocity-01-cycle-log.md` | `docs/securenow/DECISION_CYCLE_LOG.md` |
| **SN-DV-02** | `securenow-decision-velocity-02-home-row.md` | Sponsor Home row **Decision cycle** |
| **SN-DV-03** | `securenow-decision-velocity-03-operator-section.md` | `#decision-cycle` on the operator page |
| **SN-DV-04** | `securenow-decision-velocity-04-checker.md` | Extend `scripts/ci/check_securenow_decision_velocity.py` (**shipped**) |
| **SN-DV-05** | `securenow-decision-velocity-05-stall-map.md` | Each stall step links to an existing surface |
| **SN-DV-06** | `securenow-decision-velocity-06-checker.md` | Checker requires the six hrefs and a blank source log |
| **SN-DV-HOLD** | `securenow-decision-velocity-hold.md` | Stop list |

**SN-DV-01** through **SN-DV-04** are on trunk. Do not redo them. Run **SN-DV-05**, then **06**. **SN-DV-HOLD** is not a build step.

## Human tasks (owner)

These are not Composer sessions. Do them after the log exists, on a private copy. They are recorded as **M-314** in [`docs/go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md). Do not perform the walk in an implementation session. SN-DV-05 and SN-DV-06 must not write the times into source.

1. Walk `fixture-path-01` from Qualify to Close. Write the UTC start and UTC close on the `SYNTHETIC FIXTURE` row.
2. Name one stall step from that walk.
3. Select one of proceed, extend, or stop, and write a rationale that says the path is synthetic.
4. Leave beta **NO_GO** in place. Leave fees in the private quote sheet.
