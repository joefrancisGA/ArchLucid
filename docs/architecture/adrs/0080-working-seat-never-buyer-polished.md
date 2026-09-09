> **Scope:** ADR 0080 — Working seat is never buyer-polished; dense architect chrome is the product default.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0080: Working seat is never buyer-polished

- **Status:** Accepted
- **Date:** 2026-09-07
- **Owner decision:** Stop buyer polish on the Working seat (WS-01 / wave 19)

## Context

ArchLucid sells a **seat for a repeat professional** (ADR 0052 / R13). People sit in the Working desk much of the day; livelihoods may depend on the sealed review record. That seat must read as an **all-day instrument** — dense nav metadata, shortcut chips, engineering identifiers where disclosures already govern them — not as a buyer walkthrough.

Waves through 2026-09-06 shipped the right **resolver spine** but not the contract:

- **PC-04 / PT-01 / WA-01** introduced `resolveArchitectWorkspaceChrome`, `resolveProductionDeskChrome`, and a production default where `isBuyerPolishedOperatorShellEnv()` returns **false** for paying Working builds.
- Dozens of **`/al-ui-rate`** merges and grandfathered call sites still mount buyer-polished chrome (softer Jump control, fewer shortcut chips, friendly scope labels) when workspace mode is Working.
- **`NEXT_PUBLIC_OPERATOR_EXPERIENCE`** and dev cookie overrides (`buyer-polished` vs `full-operator`) can still make a Working tenant look like an eval session even when `workspaceMode=Working`.

**Eval chrome remains correct** on Guided, demo, static showcase, and frictionless trial — ADR 0067 two-door teaching, first-run Socratic intake, and buyer-safe marketing banners are **not** defects on those seats.

**Related (not rewritten):** ADR 0067 (Guided / eval co-equal Create + Review only), ADR 0069 (Working one work object), `archlucid-ui/src/lib/production-desk-chrome.ts`, `archlucid-ui/src/lib/demo-ui-env.ts`, `archlucid-ui/src/lib/architect-workspace-chrome.ts`, `.cursor/commands/al-ui-rate.md`.

## Decision

1. **Working seat contract:** When `workspaceMode` is **Working** on a production-like host, **buyer-polished / eval operator chrome is forbidden**. Dense architect chrome is the **default product surface**, not an overlay unlocked by `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` or a dev cookie.
2. **Resolver authority:** `resolveProductionDeskChrome()` / `resolveArchitectWorkspaceChrome()` are the **only supported gates** for Working vs eval chrome on authenticated operator surfaces. **`isBuyerPolishedOperatorShellEnv()` alone must not decide Working chrome** — it ignores workspace mode (WS-05–06).
3. **Explicit reject:** **"Buyer-polished is the production default"** for Working tenants. No PR may cite unset `NEXT_PUBLIC_OPERATOR_EXPERIENCE`, `/al-ui-rate` buyer-confidence remediations, or grandfather inventory growth to soften the paying desk.
4. **Explicit keep:** Guided, demo, static showcase, and frictionless trial **keep** buyer-polished eval skin, ADR 0067 two-door teaching, and buyer-safe marketing chrome. **`/al-ui-rate` remains** for those seats and for screenshot pipelines that declare eval context — it must **not** ship buyer-walkthrough fixes onto Working production modules (WS-07).
5. **Security / disclosure parity:** Eval chrome must **not** hide shortcut chips, engineering identifiers, or instrument affordances that Working already exposes behind existing disclosures (collapsible panels, trust labels, TB-645 honesty strips). Buyer polish may simplify **copy** on eval seats; it may not remove Working-only safety or audit affordances when workspace mode is Working.
6. **Implementation waves:** WS-04–WS-24 evict leftover mounts, ratchet tests, and `/al-ui-rate` command rules. This ADR records the contract only; resolver sweeps are WS-05+.

## Trade-offs

**Gains:** Reviewers can quote 0080 to refuse a Working `/al-ui-rate` buyer-walkthrough fix; the paying seat stops oscillating between instrument and demo; keyboard atlas and shortcut chips stay trainable for repeat professionals; one resolver story replaces env-flag + grandfather + workspace-mode drift.

**Sacrifices:** First-run Working operators lose eval-style hand-holding on the same build — Guided remains the teaching seat; `/al-ui-rate` scores on Working screenshots will look harsher (density, chips, identifiers visible); every grandfathered `isBuyerPolishedOperatorShellEnv()` call site needs migration or an explicit WS inventory row; local dev cookie overrides must not silently polish Working without a declared eval context.

**Rejected:** Deleting `/al-ui-rate` or Guided eval chrome; rewriting ADR 0067 Guided teaching; making `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` the production Working default; collapsing review workspace tabs behind **More**; merging buyer polish into "nice defaults" without workspace-mode guard.

## Constraints

- **ADR 0067 body unchanged** — co-equal Create + Review applies to **Guided / demo / trial / eval** only; Working follows ADR 0069 one work object.
- **Do not** hide desktop review workspace tabs behind **More** (product direction).
- **Do not** merge `DraftRequests` and `Runs`; **do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` demotion predicate (ADR 0070).
- **Do not** add a 40th coverage engine or invent live presence, finding-comment chat, or per-architecture ACL (ADR 0037).
- **TB-645 vocabulary** on all buyer-visible copy touched by follow-up waves.
- Terraform for any net-new infra — this ADR should not require infrastructure changes.

## Expected impact

**System:** WS-05+ enforce `resolveProductionDeskChrome` at mount boundaries; WS-07 retargets `/al-ui-rate` implement phase to refuse Working buyer remediations; WS-22 ratchets Working Vitest fixtures to stop setting buyer-polished true by default.

**Security:** Working operators retain instrument-level disclosures (identifiers, shortcuts to audit surfaces) that eval chrome had been hiding; eval seats unchanged — buyer-safe demo marketing still suppresses raw fixture IDs where `isBuyerSafeDemoMarketingChromeEnv()` applies.

**Operations:** PR review cites 0080 alongside workspace mode in `/al-ui-rate` and chrome diffs; grandfather inventory (WS-08) shrinks only — no new Working eval mounts without an ADR exemption.

**Cost:** Engineering time for WS-04–24 call-site sweep; negligible runtime (resolver checks are synchronous).

**Teams:** Support distinguishes "switch to Guided for walkthrough" vs "Working is the instrument"; design partners on Guided/demo unchanged; Working screenshots in sales decks must use Guided/demo builds or declare eval context.

## Consequences

- **Positive:** Working is the product, not an eval skin with an operator flag; livelihood seat aligns with ADR 0052 seat license and ADR 0079 desk-as-surface.
- **Negative:** Short-term grep churn across `isBuyerPolishedOperatorShellEnv` call sites; `/al-ui-rate` backlog items tagged buyer-confidence may need Guided-only reruns.
- **Follow-ups:** WS-04 inventory; WS-05 resolver hardening; WS-06–09 call-site and hub sweeps; WS-21 shortcut chips; WS-22 test ratchet; WS-24 wave close audit.
