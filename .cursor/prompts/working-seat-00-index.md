<!-- Working-seat Composer prompts — paste one prompt per session.
     Origin: 2026-09-07 owner decision: stop buyer polish on the Working seat.
     Wave 19 after system-desk-00-index.md (SY-01–SY-100).
     SY nested the desk; this set makes Working the product, not an eval skin.
     Do not implement from this index. -->

# Working-seat mitigations — Composer prompt set (WS-01–WS-24)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**This set is wave 19. It owns only:** buyer polish and eval chrome still shaping the **Working** seat; expert-vs-Socratic daily start; Working career defaults (hidden low-confidence, finalize with degraded coverage); pre-save and idle continuity leftovers.

**Owner authorization (this wave):** **Stop buyer polish on the Working seat.** Working is the product. Guided / demo / trial keep eval chrome. **Do not merge tables.** **Add ADR 0080.** **Accept ADR 0078 and 0079** (implementation already shipped; status lag).

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Contract** | Dual skin; 0078/0079 Proposed | **ADR 0080**; 0078/0079 Accepted | WS-01–03 |
| **Eval eviction** | Grandfather + `/al-ui-rate` buyer brief | Working cannot mount eval chrome | WS-04–09 |
| **Expert hub** | First-week babysit; wizard-first; launch-pad desk | Resume/dump; inhabit the desk | WS-10–12 |
| **Career defaults** | Hide low-confidence; advisory degraded coverage | Show rows; block Working finalize | WS-13–14 |
| **Continuity** | localStorage-as-saved; wait-on-tab; idle wipes fields | Server persist; background wait; dirty restore | WS-15–18 |
| **Teaching / ratchet** | Help teaches two products; Working tests set buyer true | Working docs + fixtures; Guided split; close audit | WS-19–24 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); ADR 0068 two kernels and separate SQL tables; spawn lock; document undo (ADR 0071); density gate (ADR 0070); trail finalize gate (ADR 0073); disposition 409 (ADR 0076); desktop review **tabs** as a full strip; Guided / demo / trial as eval sessions; `MUTATION_UNDO_WINDOW_SECONDS = 300`; BFF session (LK-05–07).

Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** add a 40th coverage engine. Do **not** invent live presence, finding-comment chat, or per-architecture ACL. Do **not** lengthen 300s undo. Do **not** unseal. Do **not** paste **DX** density engines or **FC** validator rewrites except Accept 0078.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **SY-01–100** | Wave 18 desk URLs | **Do not re-run.** WS owns dual skin SY forbade |
| **FC-01–80** | Career artifact validators | Do not re-run; WS Accepts 0078 + Working defaults |
| **PC-04** | Eval chrome resolver | Do not fork; WS shrinks grandfather + `/al-ui-rate` |
| **PT-01** | Buyer-polish eval-only env | Shipped env default; WS owns remaining call sites |
| Overlay waves | Chrome | Do not re-run / do not fork |

If a row lists a SY/FC/PC/PT owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Run order

**ADR → inventory → resolver → sweep → command → CI → surfaces.**

Prefer **01 → 02 → 03 → 04 → 05**. Then **06–09** (call sites, al-ui-rate, ratchet, BuyerChrome). Then **10–12** (expert loop). Then **13–14** (career defaults). Then **15–18**. **19–23** independent after 05. **24** last.

**01** must not rewrite 0067. **05** must not make Guided production-dense. **07** must not delete `/al-ui-rate` for Guided/demo. **13** must not hide policy-blocking rows. **14** must not unseal. **19** must not add finding-comment chat. **23** must not auto-switch Guided → Working.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `working-seat-01-adr-0080-working-never-buyer-polished.md` | Paying seat still treated as a walkthrough |
| 02 | `working-seat-02-accept-adr-0078.md` | Career honesty shipped; ADR still Proposed |
| 03 | `working-seat-03-accept-adr-0079-and-index-hygiene.md` | Desk-as-surface shipped; index lists stale Proposed |
| 04 | `working-seat-04-inventory-working-eval-leaks.md` | Unknown leftover buyer-polish mounts |
| 05 | `working-seat-05-working-cannot-be-eval-chrome.md` | Cookie/env can still polish a Working seat |
| 06 | `working-seat-06-buyer-polish-call-site-sweep.md` | `isBuyerPolishedOperatorShellEnv()` ignores workspace mode |
| 07 | `working-seat-07-al-ui-rate-instrument-not-buyer.md` | `/al-ui-rate` ships buyer-confidence remediations onto Working |
| 08 | `working-seat-08-eval-grandfather-shrink-only.md` | Eval-guard grandfather still grows |
| 09 | `working-seat-09-buyer-chrome-never-on-working-hubs.md` | Hub/Home/review-detail still mount BuyerChrome |
| 10 | `working-seat-10-no-first-week-babysit-on-working.md` | “Stay on this page until you finalize” |
| 11 | `working-seat-11-expert-start-not-socratic.md` | Daily start is still the naive wizard |
| 12 | `working-seat-12-desk-is-not-a-launch-pad.md` | Identity desk is summary + Start review |
| 13 | `working-seat-13-show-low-confidence-by-default.md` | Working hides low-confidence findings |
| 14 | `working-seat-14-degraded-coverage-blocks-finalize.md` | Incomplete engines still stamp |
| 15 | `working-seat-15-first-persist-is-server-identity.md` | Pre-save work advertised as this-browser saved |
| 16 | `working-seat-16-pipeline-leakage-off-working.md` | Pipeline / Service Bus chrome on the paying desk |
| 17 | `working-seat-17-wait-is-background.md` | Wait-on-this-tab is still the job |
| 18 | `working-seat-18-idle-preserves-dirty-forms.md` | Idle restore is URL-only |
| 19 | `working-seat-19-architecture-open-questions.md` | Judgment leaks to Word; no finding chat |
| 20 | `working-seat-20-help-teaches-working-as-product.md` | Help still teaches two start products |
| 21 | `working-seat-21-working-keeps-shortcut-chips.md` | Buyer polish hides instrument shortcuts |
| 22 | `working-seat-22-working-tests-must-not-set-buyer-true.md` | Working Vitest mocks buyer-polished |
| 23 | `working-seat-23-guided-demo-trial-keep-eval-skin.md` | Eviction would delete teaching |
| 24 | `working-seat-24-wave-close-audit.md` | Without audit, dual skin returns next week |

## Global constraints (every prompt)

See each file’s **Constraints**. In short: no desktop **More** menu; no merge of `DraftRequests`/`Runs`; no 40th engine; no finding-comment chat; no GTM **M-90 / M-44 / M-91 / M-92**; no reopen **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.
