<!-- SecureNow customer self-sufficiency — Composer prompts.
     Origin: 31 October 2026 desk pass. Customer Self-Sufficiency 62, weight 1.
     SN-SELF-01–04 are shipped on trunk. Do not implement from this index. -->

# SecureNow customer self-sufficiency — prompt set (SN-SELF-01–08)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-SELF-01** | `docs/securenow/SELF_SERVICE.md` — four stuck states, then the existing ArchLucid mailbox. **Shipped.** |
| 2 | **SN-SELF-02** | SecureNow Home **When you are stuck**, one link to the operator page. **Shipped.** |
| 3 | **SN-SELF-03** | `/administration/securenow-self-service` on the security product line. **Shipped.** |
| 4 | **SN-SELF-04** | Warn-only checker. **Shipped.** |
| 5 | **SN-SELF-05** | Anchors `#collection`, `#connector`, `#ranking`, `#email`. |
| 6 | **SN-SELF-06** | Four Home rows, none recommended first. |
| 7 | **SN-SELF-07** | Ranking check links Priorities & waves and the remediation tracker. |
| 8 | **SN-SELF-08** | Checker extension. |
| — | **SN-SELF-HOLD** | Stop list. Paste only when a session drifts. |

**SN-SELF-01** through **SN-SELF-04** are on trunk. Do not redo them. Run **SN-SELF-05**, then **06**, then **07**, then **08**. **SN-SELF-HOLD** is not a build step. Customer Self-Sufficiency is **66** (weight 1). The owner check is **M-315**.

Intake stays `mailto:support@archlucid.net?subject=SecureNow`. Do not open `/administration/support` on the security product line. That page is the ArchLucid support bundle.
