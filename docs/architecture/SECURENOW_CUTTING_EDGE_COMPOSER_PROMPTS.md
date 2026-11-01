> **Scope:** Paste-ready Composer prompts for SecureNow cutting-edge AI. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-cutting-edge-00-index.md`](../../.cursor/prompts/securenow-cutting-edge-00-index.md)

# SecureNow cutting-edge AI — Composer prompts

**Created:** 2026-11-01 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Cutting-Edge AI Technology scored **62** on the 31 October 2026 desk pass (weight 8, weighted deficiency 304). Infrastructure Ask already redacts, requests JSON, and cites a capped bundle. The ranked path and its cut point stay on `PathRankingEngine` and stored records, and they are not an Ask topic. These prompts add a `RankedPath` topic that explains one stored path.

They aim at about **70**. That is an Ask explanation of stored hops, stored rank dimensions, and the stored cut point. It is not a new ranker and not a numeric likelihood. Moving from 62 to 70 on this weight is about half a point on the 120-weight desk pass (about 71.7% if the rest of the scorecard stays put).

AI/Agent Readiness is a separate quality. **TB-178** and **TB-191**–**TB-195** are Done on the agent pipeline. Do not reopen them here.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-CE-01** | `securenow-cutting-edge-01-ranked-path-topic.md` | `RankedPath` when `SecurityEvidencePathId` is set |
| **SN-CE-02** | `securenow-cutting-edge-02-path-bundle.md` | Stored path, hops, rank, and cut point |
| **SN-CE-03** | `securenow-cutting-edge-03-grounded-answer.md` | Citation allow-list, no new sort, no numeric likelihood |
| **SN-CE-04** | `securenow-cutting-edge-04-fixture-and-checker.md` | Fixture question and warn-only checker |
| **SN-CE-HOLD** | `securenow-cutting-edge-hold.md` | Stop list |

Run **SN-CE-01**, then **02**, then **03**, then **04**. **SN-CE-HOLD** is not a build step.
