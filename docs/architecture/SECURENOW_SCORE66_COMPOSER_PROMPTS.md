> **Scope:** Paste-ready Composer prompts for Cursor-shippable work on SecureNow attributes scored 66. Internal engineering only. Do not implement from this record.
> **Index:** [`.cursor/prompts/securenow-score66-00-index.md`](../../.cursor/prompts/securenow-score66-00-index.md)

# SecureNow score-66 follow-up — Composer prompts

**Created:** 2026-11-01 · **Audience:** Composer 2.5 slow (`composer-2.5`)

The 1 Nov 2026 board has five attributes at **66**: Time-to-Value (weight 7), Compliance Readiness (weight 2), Decision Velocity (weight 2), Cognitive Load (weight 1), and Customer Self-Sufficiency (weight 1). The first four engineering waves for compliance, decision velocity, cognitive load, and self-sufficiency are already on trunk. These prompts are the next increments. They aim at making the shipped surfaces findable and honest. They do not, by themselves, record the owner walks.

| Attribute | Prompt set | What it ships |
|---|---|---|
| Time-to-Value | `securenow-time-to-value-01-first-answer.md`–`securenow-time-to-value-04-checker.md` | A definition of the first useful answer, a first-hour section, one Home row, and a warn-only checker. |
| Compliance Readiness | `securenow-compliance-05-operator-page.md`–`securenow-compliance-07-download-limit.md` | An operator page for the shipped duty split and coverage card, one Home row, and a lineage-download limit sentence. |
| Decision Velocity | `securenow-decision-velocity-05-stall-map.md`–`securenow-decision-velocity-06-checker.md` | Each stall step links to a surface that already exists. The source log stays blank. |
| Cognitive Load | `securenow-cognitive-load-04-question-empty.md`–`securenow-cognitive-load-06-checker.md` | One next action on the question-queue empty filter and on the SecureNow remediation-wave empty state. |
| Customer Self-Sufficiency | `securenow-self-05-anchors.md`–`securenow-self-08-checker.md` | Anchors for the four stuck situations, Home rows to those anchors, and a second link on the ranking check. |

## Human tasks

These prompts do not perform the owner walks.

| Attribute | Owner row | What stays with the owner |
|---|---|---|
| Time-to-Value | **M-308** | Uncoached first-hour stall note. The timed cohort stays **M-90** on the V1.1 GTM backlog. |
| Compliance Readiness | **G-REAL-05**, **G-ASSURANCE-02** | SOC 2 CPA kickoff and the third-party pen-test program. |
| Decision Velocity | **M-314** | One private `SYNTHETIC FIXTURE` row with UTC start, UTC close, one stall, and a synthetic outcome. |
| Cognitive Load | **M-311** | One uncoached first-review pass. |
| Customer Self-Sufficiency | **M-315** | One pass through the four stuck situations. |

## Stop

No clock or minutes-to-value claim. No CPA report, pen-test statement, or numeric compliance score. No times written into `DECISION_CYCLE_LOG.md`. No mailbox, support SLA, or ArchLucid support bundle on SecureNow. No hidden review-workspace tabs.
