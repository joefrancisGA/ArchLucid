> **Scope:** Paste-ready Composer prompts for the next SecureNow decision-velocity increment. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-decision-velocity-00-index.md`](../../.cursor/prompts/securenow-decision-velocity-00-index.md)

# SecureNow decision velocity — Composer prompts

**Created:** 2026-11-01 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Decision Velocity scored **63** on the 1 November 2026 desk pass (weight 2). The six-step path, the blank pilot decision record, the operator prep page, and the sponsor Home link are already on master. What is missing is a qualify-to-close timer and a named stall step.

These prompts add a blank cycle log, one Home row, an operator section, and an extension of the existing warn-only checker. They aim at about **66**. A person filling one `SYNTHETIC FIXTURE` row, with real start and close times and one stall step, is the human work that can move the score toward **70**.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-DV-01** | `securenow-decision-velocity-01-cycle-log.md` | `docs/securenow/DECISION_CYCLE_LOG.md` |
| **SN-DV-02** | `securenow-decision-velocity-02-home-row.md` | Sponsor Home row **Decision cycle** |
| **SN-DV-03** | `securenow-decision-velocity-03-operator-section.md` | `#decision-cycle` on the operator page |
| **SN-DV-04** | `securenow-decision-velocity-04-checker.md` | Extend `scripts/ci/check_securenow_decision_velocity.py` |
| **SN-DV-HOLD** | `securenow-decision-velocity-hold.md` | Stop list |

Run **SN-DV-01**, then **02**, then **03**, then **04**. **SN-DV-HOLD** is not a build step.

## Human tasks (owner)

These are not Composer sessions. Do them after the log exists, on a private copy or in a follow-up you explicitly ask an agent to record.

1. Walk `fixture-path-01` from Qualify to Close. Write the UTC start and UTC close on the `SYNTHETIC FIXTURE` row.
2. Name one stall step from that walk.
3. Select one of proceed, extend, or stop, and write a rationale that says the path is synthetic.
4. Leave beta **NO_GO** in place. Leave fees in the private quote sheet.
