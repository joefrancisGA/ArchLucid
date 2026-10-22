> **Scope:** Copy-paste Composer prompts — first-login live workspace vs explicit training (LS-001–LS-024). Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/live-seat-00-index.md`](../../.cursor/prompts/live-seat-00-index.md) (**LS-001–LS-024**)
> **Related:** [`RECORD_PRACTICE_COMPOSER_PROMPTS.md`](RECORD_PRACTICE_COMPOSER_PROMPTS.md) (**RP** — Record / Practice review type). Do **not** re-run RP. This overlay is **scope + first-session purpose**, not a third review-type chip.
> **Related:** [`docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`](../library/OPERATOR_UI_EXPERIENCE_MODES.md) (Working vs Guided). Training is not a fourth chrome mode.

# Live-seat Composer prompts (LS-001–LS-024)

**Created:** 2026-09-20 · **Status:** prompt set only — do not implement from this document’s tables.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. A signed-in operator who picks **Record** must still be in **their** tenant workspace with live data, not a sample/demo scope that correctly screams **NOT LIVE DATA**.

Paste **one** `.cursor/prompts/live-seat-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Owner 2026-09-20 (Record selected, still on **Customer Intake Demo**):

Record / Practice is the review-type chooser and is working. The remaining lie is **scope**. Signed-in users still land on (or remain in) the sample workspace, so Home shows **NOT LIVE DATA**, **DEMO — NOT LIVE**, and “this is not your tenant” even though Record is selected. Record is for live tenant reviews; sample scope is training data.

The product already has most of the machinery:

- Post-auth bootstrap destinations: accept invitation / select workspace / create workspace / no-access / complete (`PostAuthBootstrapService`).
- Tenant provisioning already creates a **default workspace + project** (`ITenantProvisioningService`).
- Dedicated vs sample scope bootstrap (`bootstrapDedicatedWorkspaceScope`) exists but still loses to persisted Customer Intake Demo / dev-default scope for many signed-in sessions.
- Guided vs Working is workspace mode. Record vs Practice is review type. Neither is “am I in my tenant?”

### Done test

After this wave:

1. A signed-in user who did not choose Training lands on **their live tenant workspace**. Home does not show **NOT LIVE DATA** / **Customer Intake Demo** as the active scope.
2. First login (no stored first-session purpose) **unambiguously asks** Training vs start in my workspace. Returning users skip.
3. Admin invite is the normal path: accept → invited live workspace (already waiting). Create-workspace is only when there is no membership and the user may create.
4. Training is an explicit opt-in. It does **not** silently replace live scope. It does **not** become a third Record/Practice segment.
5. Record + sample workspace still shows honesty banners. Do not hide **NOT LIVE DATA** to make Record look live.
6. Empty live Home primary CTA is start work, not Open sample review.

## Diagnosis → prompt

| Class | Prompts |
|-------|---------|
| ADR + glossary + inventory | **LS-001–LS-003** |
| Post-auth destinations (invite / select / create / default waiting) | **LS-004–LS-005**, **LS-008–LS-009**, **LS-016** |
| First-session chooser + persist + exit | **LS-006–LS-007**, **LS-011**, **LS-014** |
| Scope bootstrap + empty Home + honesty | **LS-010**, **LS-012–LS-013** |
| Help / telemetry / tests | **LS-015**, **LS-017–LS-019**, **LS-023** |
| Skips / inventory / close | **LS-020–LS-022**, **LS-024** |

## Sequencing

See [`.cursor/prompts/live-seat-00-index.md`](../../.cursor/prompts/live-seat-00-index.md).

Load-bearing ADR: **0102** (this wave). **0086 / 0091 / 0094 / 0097** not rewritten.

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- ADR 0068 two kernels and two SQL tables stay.
- Sealed records stay immutable.
- Guided / demo / trial **remain** eval sessions when those flags are on.
- `AgentExecution:Mode` host default **Simulator** stays; Record vs Practice is chrome + stamp (no G-REAL-06).
- Stored door tokens stay `"career"` / `"rehearsal"`.
- Sample / Customer Intake Demo **remains** for Training and explicit sample visits.
- Honesty banners on sample scope **remain**.
- No live presence / finding-comment chat / per-architecture ACL beyond RestrictToShares (0087).
- No 40th coverage engine.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Global constraints

See the index. Working-tree safety; TB-645; TB-2005; focused tests; scoped compile; OpenAPI when wire changes.
