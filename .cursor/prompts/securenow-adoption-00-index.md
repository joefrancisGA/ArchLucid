<!-- SecureNow adoption friction — Composer prompts.
     Origin: 2026-10-31 desk pass. SecureNow score 60, then 64 after SN-ADOPT-01–04.
     SN-ADOPT-01–08 are shipped on trunk.
     Do not implement from this index. -->

# SecureNow adoption friction — prompt set (SN-ADOPT-01–08)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-ADOPT-01** | Four-step first-hour note. **Shipped.** |
| 2 | **SN-ADOPT-02** | SecureNow Home **Start here** section. **Shipped.** |
| 3 | **SN-ADOPT-03** | Operator page `/administration/securenow-first-hour`. **Shipped.** |
| 4 | **SN-ADOPT-04** | Warn-only adoption checker. **Shipped.** |
| 5 | **SN-ADOPT-05** | Name Path inspect on step 3. Remove the second factory link. **Shipped.** |
| 6 | **SN-ADOPT-06** | Start here lists five unique rows. **Shipped.** |
| 7 | **SN-ADOPT-07** | Regression test for the empty-collection environment link. **Shipped.** |
| 8 | **SN-ADOPT-08** | Extend the warn-only adoption checker. **Shipped.** |
| — | **SN-ADOPT-HOLD** | Stop list for 01–04. Wave 2 uses `securenow-adoption-05-hold.md`. Paste only when a session drifts. |

**SN-ADOPT-01** through **SN-ADOPT-08** are on trunk. Do not redo them. **SN-ADOPT-HOLD** is not a build step.
