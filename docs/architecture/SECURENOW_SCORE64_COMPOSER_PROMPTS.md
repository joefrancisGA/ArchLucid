> **Scope:** Paste-ready Composer prompts for Cursor-shippable work on SecureNow attributes currently scored 64. Internal engineering only. Do not implement from this record.
> **Index:** [`.cursor/prompts/securenow-score64-00-index.md`](../../.cursor/prompts/securenow-score64-00-index.md)

# SecureNow score-64 follow-up — Composer prompts

**Created:** 2026-11-01 · **Audience:** Composer 2.5 slow (`composer-2.5`)

The latest 47-attribute board has five attributes at **64**: Adoption Friction, Accessibility, Cognitive Load, Stickiness, and Template and Accelerator Richness. Adoption Friction wave 2 is implemented in [PR #5879](https://github.com/joefrancisGA/ArchLucid/pull/5879); the owner walk remains a GTM task.

The existing prompt sets for Accessibility, Stickiness, and Template and Accelerator Richness are ready to paste. This follow-up adds three Cognitive Load prompts for safe next actions, terminology alignment, and a warn-only regression checker.

| Attribute | Prompt set | What it ships |
|---|---|---|
| Adoption Friction | `securenow-adoption-05-path-inspect.md`–`securenow-adoption-08-checker.md` | Path inspect wording, unique Start here rows, collection-link regression coverage, and checker extension. **Implemented in PR #5879.** |
| Accessibility | `securenow-accessibility-01-scope.md`–`securenow-accessibility-04-checker.md` | Scope note, operator page, axe coverage, and warn-only checker. |
| Cognitive Load | `securenow-cognitive-load-01-next-action.md`–`securenow-cognitive-load-03-checker.md` | One safe next action per empty or blocked state, canonical first-review nouns, and drift checker. |
| Stickiness | `securenow-stickiness-01-return-reasons.md`–`securenow-stickiness-04-checker.md` | Four honest reopen reasons, Home/operator exposure, and warn-only checker. |
| Template and Accelerator Richness | `securenow-scenario-01-chooser.md`–`securenow-scenario-03-checker.md` | Five-row fixture chooser, short fixture packs, and warn-only checker. |

## Human validation

Owner-led tasks are tracked in `docs/go-to-market/GTM_BACKLOG.md` as **M-308–M-312**. Do not convert those observations into product claims or score increases without the recorded evidence.

These prompts do not certify WCAG, claim assistive-technology user testing, claim customer retention, fill the executive proof packet, add a timed SLA, or hide review workspace tabs.
