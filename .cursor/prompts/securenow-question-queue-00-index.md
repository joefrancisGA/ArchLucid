<!-- SecureNow question queue — Luna prompts.
     Origin: 2026-10-03 owner ask, after the diagrams workbench showed an
     empty inference questionnaire while the plate still had diagram-evidence
     questions. SN-QQ-01–10 are shipped on trunk. Do not implement from this index. -->

# SecureNow question queue — prompt set (SN-QQ-01–SN-QQ-10)

One subscription has one question queue. Paste **one** numbered file per session, in order. SN-QQ-01 through SN-QQ-08 were written for GPT-5.6 Luna. **SN-QQ-09** and **SN-QQ-10** run on Composer 2.5 slow (`composer-2.5`).

Copy-paste docs index: [`docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_QUESTION_QUEUE_LUNA_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-QQ-01** | Store and API. Disposition survives the next snapshot. **Shipped.** |
| 2 | **SN-QQ-02** | Emit a question only when an answer changes the next action. **Shipped.** |
| 3 | **SN-QQ-03** | Hero and drawer. Say nothing when the open count is zero. **Shipped.** |
| 4 | **SN-QQ-04** | Outline Answer control on rows that already have a question. **Shipped.** |
| 5 | **SN-QQ-05** | Assigned-pack questions that have no node. **Shipped.** |
| 6 | **SN-QQ-06** | An asserting answer expires as `HumanAssertion`. Ignore does not. **Shipped.** |
| 7 | **SN-QQ-07** | A failed load shows the API reason. A GET does not use the governance save copy. **Shipped.** |
| 8 | **SN-QQ-08** | Map the questions controller so Diagrams stops 500ing `Unmapped API controller`. **Shipped.** |
| 9 | **SN-QQ-09** | Name the resource, say why SecureNow is asking, and show its highlighted neighborhood. **Shipped.** |
| 10 | **SN-QQ-10** | Show `Action needed`, the open count in medium helper type, and outline `Review questions`. **Shipped.** |
| — | **SN-QQ-HOLD** | Stop list. Paste only when a session drifts. |

**SN-QQ-01** through **SN-QQ-10** are on trunk. Do not redo them. **SN-QQ-HOLD** is not a build step.
