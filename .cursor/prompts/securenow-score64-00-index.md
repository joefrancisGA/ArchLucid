<!-- SecureNow score-64 follow-up prompts.
     These prompts package the Cursor-shippable work for the five attributes that were 64 on the latest 47-attribute board.
     Do not treat the human tasks as engineering work. Do not implement from this index. -->

# SecureNow score-64 follow-up prompts

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

The owner-led validation tasks are in [`docs/go-to-market/GTM_BACKLOG.md`](../../docs/go-to-market/GTM_BACKLOG.md), rows **M-308–M-312**. These prompts cover only work Cursor can ship now.

| Attribute | Existing prompt set | Status |
|---|---|---|
| Adoption Friction | `securenow-adoption-05-path-inspect.md` through `securenow-adoption-08-checker.md` | Implemented in PR #5879; human walk remains M-308 |
| Accessibility | `securenow-accessibility-01-scope.md` through `securenow-accessibility-04-checker.md` | Ready to paste |
| Stickiness | `securenow-stickiness-01-return-reasons.md` through `securenow-stickiness-04-checker.md` | Ready to paste |
| Template and Accelerator Richness | `securenow-scenario-01-chooser.md` through `securenow-scenario-03-checker.md` | Ready to paste |
| Cognitive Load | `securenow-cognitive-load-01-next-action.md` through `securenow-cognitive-load-03-checker.md` | Ready to paste |

Run one existing attribute set at a time. For Cognitive Load, run **SN-COG-01**, then **SN-COG-02**, then **SN-COG-03**. Each prompt must be implemented in its own session. The hold files are not build steps.

Do not use these prompts to claim customer adoption, retention, WCAG certification, assistive-technology user testing, or completed buyer validation. Do not hide review workspace tabs behind More.
