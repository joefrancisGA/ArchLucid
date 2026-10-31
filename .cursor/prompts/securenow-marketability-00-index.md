<!-- SecureNow marketability — Composer prompts.
     Origin: 2026-10-29 desk review. Marketability was 36, then 50, then 61.
     SN-MKT-08–11 publish the accepted copy. Do not implement from this index. -->

# SecureNow marketability — prompt set (SN-MKT-01–11)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-MKT-01** | Security section on Home states the buyer job. The recommended first row opens a ranked path. **Shipped.** |
| 2 | **SN-MKT-02** | Unlisted, noindex draft of a Why SecureNow page. Request a conversation. Beta stays NO_GO. **Shipped.** |
| 3 | **SN-MKT-03** | Six-beat fixture storyboard a facilitator can read aloud. Every beat is labeled a fixture. **Shipped.** |
| 4 | **SN-MKT-04** | `/why-securenow` renders on the SecureNow product line. Other marketing routes still redirect home. **Shipped.** |
| 5 | **SN-MKT-05** | Forwardable buyer overview. Links the pack, the quote cover, and the pilot proposal. No fees. **Shipped.** |
| 6 | **SN-MKT-06** | SecureNow Home "For reviewers" links the draft, the reviewer packet, and the conversation mailto. **Shipped.** |
| 7 | **SN-MKT-07** | Warn-only checker for the internal draft. **Shipped.** SN-MKT-11 retargets it. |
| 8 | **SN-MKT-08** | Index `/why-securenow`. Keep the accepted pitch, steps, refusals, and `support@archlucid.net` mailto. Replace the draft banner with a beta NO_GO status line. |
| 9 | **SN-MKT-09** | Indexed `/securenow-sample`: one synthetic path, cited hops, and an advisory cut point. Same mailto. |
| 10 | **SN-MKT-10** | Resources menu links Why SecureNow and SecureNow sample. Home reviewer links follow. |
| 11 | **SN-MKT-11** | Warn-only checker requires the public pages and still rejects a price. |
| — | **SN-MKT-HOLD** | Stop list. Paste only when a session drifts. |

**SN-MKT-01** through **SN-MKT-07** are on trunk. Do not redo them. Run **SN-MKT-08**, then **09**, then **10**, then **11** in one pull request. **08** through **10** leave the shipped checker red on purpose until **11**. **SN-MKT-HOLD** is not a build step.

The accepted copy is the pitch, the audience, the six steps, and the five refusals. These prompts do not rewrite that copy. Conversation intake stays `mailto:support@archlucid.net?subject=SecureNow%20conversation`.
