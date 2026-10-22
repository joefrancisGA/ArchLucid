> **Scope:** Contributor-reference — system-gravity (SG) explicit out-of-wave skips for wave 32 close audit. Not buyer-facing copy.

# System-gravity out-of-wave residuals

**Status:** recorded in [`SYSTEM_GRAVITY_COMPOSER_PROMPTS.md`](SYSTEM_GRAVITY_COMPOSER_PROMPTS.md) (SG-082+) · **Do not** mark these rows shipped unless product actually ships them.

| Item | Tracking | Owner prompt | Status | Notes |
|------|----------|--------------|--------|-------|
| Draft-to-draft Compare | R12 rejected alternative / ADR **0092** | **SG-082** | **Not shipped** | Compare stays two committed manifests (SN-038 / CE-017). Cheap sketch remains clone-from-snapshot. |
| Merge DraftRequests and Runs kernels | ADR **0092** | **SG-111** | **Not shipped** | Spawn-locked drafts are not a second Career editor. |
| Live presence (avatars, cursors, occupancy) | ADR **0090** / LW-089 lease | **SG-112** | **Not shipped** | Work-lease is the collab primitive — not live presence or finding-comment chat. |
| Collapse desktop review tabs behind More | Product direction | **SG-113** | **Not shipped** | Review workspace tabs stay on the default strip. |
| System-wide breadcrumbs | Retired IA | **SG-114** | **Not shipped** | Desk continuity and nested locators replace breadcrumbs. |
| Unseal to edit sealed parent | ADR **0039** | **SG-115** | **Not shipped** | Clone-from-snapshot is the sketch path. |
| Remount cheap-envelope runner | CE wave scope | **SG-116** | **Not shipped** | Do not re-run CE runner in SG. |
| Re-implement daytime wait | DW wave scope | **SG-117** | **Not shipped** | Do not re-run DW in SG. |
| G-REAL-06 host Mode flip | GTM owner program | **SG-118** | **Not shipped** | Host `AgentExecution:Mode` default unchanged. |

## Do not claim

- Draft-diff Compare shipped in system-gravity wave 32.
- Any SG-111–118 skip closed by accident — prompts exist only to prevent scope creep.

## Ratchet

- `archlucid-ui/src/lib/system-gravity-out-of-wave-residuals.ts`
- `archlucid-ui/src/lib/system-gravity-out-of-wave-residuals.test.ts`
- `archlucid-ui/src/lib/system-gravity-wave32-batch5-guard.test.ts`
- `archlucid-ui/src/lib/system-gravity-wave32-batch7-guard.test.ts`
- `archlucid-ui/src/lib/system-gravity-close-audit.test.ts`
