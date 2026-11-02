> **Scope:** Paste-ready Composer prompts for SecureNow adoption friction. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-adoption-00-index.md`](../../.cursor/prompts/securenow-adoption-00-index.md)

# SecureNow adoption friction — Composer prompts

**Created:** 2026-10-31 · **Updated:** 2026-11-01 · **Status:** SN-ADOPT-01–08 shipped on trunk. **Audience:** Composer 2.5 slow (`composer-2.5`)

Adoption Friction scored **60** on the 31 October 2026 SecureNow desk pass (weight 6) and **64** after the first-hour note, Home **Start here** section, operator page, and warn-only checker shipped. Steps 2 and 3 still open the same Priorities & waves list. Path inspect is a panel on a selected row, and Home still has one row into the preparation page.

SN-ADOPT-05–08 name that panel, split Start here into five unique destinations, lock the existing empty-collection link with a test, and extend the warn-only checker. They are on trunk in commit `afbf73aa1d`. They do not add a setup wizard that hides collection gaps, autonomous remediation, a timed SLA, a Path inspect route, or ArchLucid first-review wizard reuse.

A human walk of `fixture-path-01` is what can move the score past this wave. These prompts do not time that walk.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-ADOPT-01** | `securenow-adoption-01-first-hour.md` | `docs/securenow/FIRST_HOUR.md` (**shipped**) |
| **SN-ADOPT-02** | `securenow-adoption-02-home-section.md` | SecureNow Home **Start here** section (**shipped**) |
| **SN-ADOPT-03** | `securenow-adoption-03-operator-page.md` | `/administration/securenow-first-hour` (**shipped**) |
| **SN-ADOPT-04** | `securenow-adoption-04-checker.md` | `scripts/ci/check_securenow_adoption_friction.py` and CI (**shipped**) |
| **SN-ADOPT-05** | `securenow-adoption-05-path-inspect.md` | Path inspect wording; step 3 has no factory href (**shipped**) |
| **SN-ADOPT-06** | `securenow-adoption-06-home-steps.md` | Five unique Start here rows (**shipped**) |
| **SN-ADOPT-07** | `securenow-adoption-07-collection-line.md` | Empty-collection link regression test (**shipped**) |
| **SN-ADOPT-08** | `securenow-adoption-08-checker.md` | Extend the warn-only adoption checker (**shipped**) |
| **SN-ADOPT-HOLD** | `securenow-adoption-hold.md` | Stop list for 01–04 |
| **SN-ADOPT-HOLD** | `securenow-adoption-05-hold.md` | Stop list for 05–08 |

**SN-ADOPT-01** through **SN-ADOPT-08** are on trunk. Do not redo them. **SN-ADOPT-HOLD** is not a build step.

## Human tasks (owner)

These are not Composer sessions.

1. Walk `fixture-path-01` using only SecureNow Home. Write one sentence naming the stall: collection, choosing a row, finding Path inspect, or naming the review question. Do not start verification or sponsor packaging.
2. If Azure access blocks the walk, write one sentence for the connector role and the subscription. Leave the capture marked missing.
3. A second person follows only the Home Start here rows and writes where they stopped. Do not add a timed SLA.
