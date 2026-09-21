<!-- Live-seat overlay — Composer prompt set (LS-001–LS-024) — paste one prompt per session.
     Origin: 2026-09-20 owner screenshot — Record selected, still on Customer Intake Demo
     with NOT LIVE DATA banners. First-login should land on the user's live workspace;
     training is an explicit first-session choice; invites join a waiting workspace.
     Do not implement from this index. -->

# Live-seat overlay — Composer prompt set (LS-001–LS-024)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/live-seat-NNN-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. **Do not** implement G-REAL-06.

**Do not** re-run RP-001–024, MG, or ADR 0086 / 0091 / 0094 / 0097 bodies except as a named leftover. Record vs Practice **semantics** stay. This wave is **where the signed-in user sits** (live tenant workspace vs sample) and **whether first login chose Training**.

## Owner decision (2026-09-20) — assumed until owner corrects

Owner asked for prompts first and invited clarifying questions. Implementers must follow the assumptions below unless a later owner message changes them. **Do not invent a fourth chrome mode.**

### Three axes (keep separate)

| Axis | Control | User-facing | Not this wave |
|------|---------|-------------|----------------|
| **Scope** | Tenant / workspace / project | Your workspace vs sample (**Customer Intake Demo**) | Do not collapse into Record/Practice |
| **First-session purpose** | One-time chooser | **Start in my workspace** vs **Training** | Not Guided/Working copy; not Practice |
| **Workspace mode** | Preferences | Working (default) vs Guided | Do not delete Guided |
| **Review type** | Top-bar chooser | Record vs Practice (ADR 0097) | Do not add Training as a third segment |

**Training** (first-session purpose) turns on **Guided** teaching chrome and an **optional sample-workspace visit**. It is **not** Practice. Practice remains a labeled dry-run on a live workspace.

**Start in my workspace** applies dedicated live scope, **Working**, and **Record**. Empty live data is still live: no reviews yet is not a reason to dump the user into demo.

### Post-auth order (normal case first)

1. **Pending invitation** → accept → land in the invited **live** workspace (already waiting on the tenant). Admin invite is the expected common path.
2. **One active membership** → complete into that live workspace (default workspace already provisioned).
3. **Several memberships** → existing select-workspace step, then live scope for the pick.
4. **No membership, may create** → prompt to create a workspace. Created workspace is **live and empty** (`includeDemoSeed` default **false**). Tenant provisioning already creates default workspace + project identifiers; this step is for self-serve owners who are not yet a member.
5. **No membership, cannot create** → existing no-access / request-access.

Then, if first-session purpose is **unset**, show the Training chooser. Returning users skip.

### Screenshot honesty (do not “fix” by hiding banners)

Record on **Customer Intake Demo** must keep **NOT LIVE DATA**. The bug is landing there without an explicit Training choice — not the banner copy.

## Owner questions (confirm or correct; do not invent)

Implementation prompts encode the **assumed** answer in parentheses. If the owner answers differently, update ADR 0102 and the matching prompt — do not silently fork.

1. **What is Training?** (Assumed: Guided + optional sample workspace. Alternative A: sample workspace only, keep Working+Record. Alternative B: Guided on the live empty workspace, no sample visit.)
2. **Do invited first-time users still see the chooser?** (Assumed: **yes**, with Start in my workspace pre-bound to the invited workspace. Alternative: skip chooser on invite-accept.)
3. **How often is the chooser shown?** (Assumed: **once per user**, server preference. Alternative: once per browser.)
4. **After declining Training, may empty live Home still offer a secondary sample walkthrough?** (Assumed: **yes, secondary only**. Primary CTA is start work.)
5. **Does an invitee get the org default workspace or a personal workspace?** (Assumed: **the workspace on the invitation**, which should be the tenant default unless the admin picked another.)
6. **Self-serve org owner:** after tenant provision, is create-workspace skipped because the default workspace is already waiting? (Assumed: **skip create when a membership already exists**; show create only when there is no membership.)

## Prompt files (paste one per session)

| # | File | Title | Cluster | Depends on |
|---|------|-------|---------|------------|
| **001** | `live-seat-001-adr-0102-first-login-live-workspace.md` | ADR 0102: first login lands on live workspace | kernel-adr | none — run first |
| **002** | `live-seat-002-inventory-signed-in-sample-scope.md` | Inventory: signed-in users still on sample scope | inventory | LS-001 |
| **003** | `live-seat-003-glossary-training-vs-workspace.md` | Glossary: Training vs Start in my workspace | copy | LS-001 |
| **004** | `live-seat-004-post-auth-destination-order.md` | Post-auth destination order: invite first | kernel | LS-001, LS-002 |
| **005** | `live-seat-005-invite-lands-on-waiting-workspace.md` | Invite-accept lands on the waiting live workspace | auth | LS-004 |
| **006** | `live-seat-006-first-session-training-chooser.md` | First-session chooser: Training vs my workspace | chrome | LS-003 |
| **007** | `live-seat-007-persist-first-session-purpose.md` | Persist first-session purpose; returning users skip | contract | LS-006 |
| **008** | `live-seat-008-create-workspace-when-needed.md` | Create-workspace prompt when no membership | auth | LS-004 |
| **009** | `live-seat-009-default-workspace-already-waiting.md` | Default live workspace already waiting | tenancy | LS-005, LS-008 |
| **010** | `live-seat-010-scope-bootstrap-never-silent-demo.md` | Scope bootstrap never silent-lands on demo | chrome | LS-002, LS-007 |
| **011** | `live-seat-011-training-maps-guided-sample.md` | Training maps to Guided + sample visit | chrome | LS-006, LS-010 |
| **012** | `live-seat-012-empty-live-home-start-work.md` | Empty live Home: start work, not Open sample | copy | LS-010 |
| **013** | `live-seat-013-keep-sample-honesty-banners.md` | Keep NOT LIVE DATA on sample even in Record | honesty | LS-010 |
| **014** | `live-seat-014-exit-training-return-live.md` | Exit Training returns to dedicated live workspace | chrome | LS-011 |
| **015** | `live-seat-015-help-first-login-training.md` | Help: first login, Training, live workspace | copy | LS-003, LS-006 |
| **016** | `live-seat-016-select-workspace-multi-membership.md` | Select workspace when invited to more than one | auth | LS-004 |
| **017** | `live-seat-017-first-session-telemetry.md` | Telemetry: first-session purpose and landing | ops | LS-007 |
| **018** | `live-seat-018-vitest-playwright-first-login-matrix.md` | Vitest and Playwright first-login matrix | ratchet | LS-005–LS-014 |
| **019** | `live-seat-019-csharp-post-auth-default-workspace.md` | C# post-auth and default-workspace ratchets | ratchet | LS-004, LS-009 |
| **020** | `live-seat-020-do-not-merge-training-with-practice.md` | Explicit skip: Training is not Practice | out-of-wave | LS-001 |
| **021** | `live-seat-021-prompt-inventory-vitest.md` | Vitest: LS-00 index + LS-001–LS-024 files exist | close | prompt-set PR |
| **022** | `live-seat-022-do-not-autoseed-demo-into-tenant.md` | Explicit skip: do not auto-seed demo into tenants | out-of-wave | LS-008 |
| **023** | `live-seat-023-workspace-scope-guide-copy.md` | Workspace scope guide and onboarding copy | copy | LS-003, LS-015 |
| **024** | `live-seat-024-wave-close-audit.md` | Wave close audit — live seat after login | close | LS-001–LS-023 |

## Run order

Follow **Depends on**. ADR first. Inventory before mutating bootstrap or Home. Chooser before scope bootstrap. Honesty banners are a keep, not a delete. Close audit last.

Suggested Cloud Agent branch per prompt: `cursor/live-seat-<short-name>-5132`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/live-seat-first-login-prompts-5132`.

## After each prompt

Summarize: files changed, tests run, whether a signed-in Record user can still screenshot Home as **NOT LIVE DATA** without having chosen Training, whether invite-accept still lands on the invited workspace, whether stored Record/Practice tokens remain `"career"` / `"rehearsal"`.

**Predecessor:** [`record-practice-00-index.md`](record-practice-00-index.md) (**RP-001–024**, shipped). Do not re-run RP.

## Global constraints (every prompt)

See any numbered file’s Constraints block. No desktop **More** menu; no `typed-engine-protected` change; no table merge; no live presence; no finding-comment chat; no GTM cohorts; no reopen TB-135/TB-136; TB-645; focused Vitest; scoped compile only for C#. No Training segment on the Record/Practice chooser. No silent demo landing for signed-in live-purpose users.
