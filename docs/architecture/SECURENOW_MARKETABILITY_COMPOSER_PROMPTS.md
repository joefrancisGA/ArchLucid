> **Scope:** Paste-ready Composer prompts for SecureNow marketability. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-marketability-00-index.md`](../../.cursor/prompts/securenow-marketability-00-index.md)

# SecureNow marketability — Composer prompts

**Created:** 2026-10-29 · **Updated:** 2026-10-31 · **Status:** SN-MKT-01–07 shipped on trunk. SN-MKT-08–11 not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Marketability scored **36** on the 2026-10-29 desk review, **50** after SN-MKT-01–03, and **61** on the 31 October desk pass. Differentiability is **78**. ArchLucid’s comparable marketability score is **68**. The accepted SecureNow copy is the pitch, the audience, the six steps, and the five refusals. SN-MKT-08–11 publish that copy. They do not rewrite it.

SN-MKT-01–07 put the buyer job on Home, in a noindex draft, in a fixture storyboard, on the security shell, in an internal overview, and in a warn-only checker. The next four prompts index `/why-securenow`, add a public synthetic sample, add two resources-menu links, and retarget the checker. Conversation intake stays `mailto:support@archlucid.net?subject=SecureNow%20conversation`. They do not approve a public price, Marketplace publication, or a beta GO.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-MKT-01** | `securenow-marketability-01-security-section-lead.md` | Security section lead and recommended first row (**shipped**) |
| **SN-MKT-02** | `securenow-marketability-02-why-page-draft.md` | Noindex `/why-securenow` draft (**shipped**) |
| **SN-MKT-03** | `securenow-marketability-03-fixture-storyboard.md` | `docs/securenow/FIXTURE_STORYBOARD.md` (**shipped**) |
| **SN-MKT-04** | `securenow-marketability-04-draft-on-security-shell.md` | Security-shell exception for `/why-securenow` (**shipped**) |
| **SN-MKT-05** | `securenow-marketability-05-buyer-overview.md` | `docs/securenow/BUYER_OVERVIEW.md` (**shipped**) |
| **SN-MKT-06** | `securenow-marketability-06-reviewer-home-links.md` | SecureNow Home "For reviewers" (**shipped**) |
| **SN-MKT-07** | `securenow-marketability-07-checker.md` | Warn-only checker for the internal draft (**shipped**; SN-MKT-11 retargets it) |
| **SN-MKT-08** | `securenow-marketability-08-publish-why.md` | Index `/why-securenow`. Keep the accepted copy. Beta **NO_GO** status line. |
| **SN-MKT-09** | `securenow-marketability-09-public-sample.md` | Indexed `/securenow-sample`. One synthetic path. Same ArchLucid mailto. |
| **SN-MKT-10** | `securenow-marketability-10-marketing-menu.md` | Resources menu: Why SecureNow and SecureNow sample. |
| **SN-MKT-11** | `securenow-marketability-11-public-checker.md` | Checker requires the public pages and still rejects a price. |
| **SN-MKT-HOLD** | `securenow-marketability-hold.md` | Stop list |

**SN-MKT-01** through **SN-MKT-07** are on trunk. Do not redo them. Run **SN-MKT-08**, then **09**, then **10**, then **11** in one pull request. **SN-MKT-HOLD** is not a build step.
