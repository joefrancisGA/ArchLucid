> **Scope:** ADR 0095 — Working **Governance** includes a sealed review records **inventory** (list). Detail stays on the manifest route. Architecture desk remains Monday-morning home; list is ledger, not landing.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0095: Sealed record inventory is a Governance home

- **Status:** Accepted
- **Date:** 2026-09-12
- **Accepted:** 2026-09-12 (owner)
- **Owner decision:** Finalized review records get a **Governance nav home** at `/governance/sealed-records`. The package detail route stays immutable. Desktop review workspace tabs stay a full strip — no **More** menu. Architecture desk remains the day’s work surface.

## Context

Livelihood IA assessment **IA-001 / IA-003**: the career artifact had no discoverable home — `/signed-records` parent 404s and orphaned lists trained distrust. **ADR 0079** made the architecture desk the Working home; **ADR 0039** keeps sealed records immutable.

**Prior waves shipped mechanics:** list page, redirects, pilot nav link, decision-register cross-link (partial). **DI-001–024** formalizes Governance placement, inventories, help, and close audit without collapsing review tabs or merging sponsor routes.

**Related (not rewritten):** ADR 0039 (immutability), ADR 0079 (desk home), ADR 0086 / 0091 (execute doors), ADR 0094 (one gravity), SN-029 (draft list reachable).

## Decision

1. **Governance inventory home.** Working **Governance** sidebar includes **Sealed review records** linking to `/governance/sealed-records` (TB-645 label). List is the ledger; detail remains `/governance/sealed-records/{manifestId}`.
2. **Architecture desk stays primary.** Monday-morning flow stays architecture → review desk → finalize. The sealed list is follow-up and procurement — not the default landing.
3. **No tab collapse.** Desktop review workspace tabs remain a full strip (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Do not hide tabs behind **More**.
4. **Legacy URL hygiene.** `/signed-records` and related legacy paths permanently redirect to the Governance canonical list — not 404.
5. **Decision register is complementary.** Decision register rows link to finalized packages; help disambiguates **package** (sealed review record) vs **ledger of dispositions** (decision register). No “signed decision record” for the package.
6. **Guided / demo / trial unchanged.** Eval skins may gate nav visibility per existing unlock rules; Working production shows the Governance link when ReadAuthority allows.

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **Where is the sealed record list?** | **Governance → Sealed review records** (`/governance/sealed-records`). |
| **Is the list Monday morning?** | **No.** Architecture desk is home; the list is the ledger. |
| **Does this collapse review tabs?** | **No.** Full tab strip unchanged. |
| **Does this merge DraftRequests and Runs?** | **No.** ADR 0068 kernels stay separate. |

## Trade-offs

**Gains:** Architects find finalized packages without bookmark archaeology. Support cites one ADR for “where is the ledger?” Procurement reviewers discover sealed records beside decision register and audit. Redirects preserve old links.

**Sacrifices:** Governance nav grows; pilot nav may still duplicate the list link for daily discoverability until product retires one entry. Help must maintain package vs register vocabulary. Inventory tables must stay shrink-only as routes evolve.

**Rejected:** Making sealed records the Working home; collapsing review tabs; merging six sponsor reporting routes; restoring system-wide breadcrumbs (TB-2090); unsealing records.

## Constraints

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No **G-REAL-06**.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** add a 40th coverage engine or change `DeterministicInsightDensityGate` `typed-engine-protected`.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary on customer copy. TB-2005 on forms.
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus numbered migrations — this ADR adds no tables.

## Expected impact

**System:** Governance nav exposes sealed review records inventory; list and detail routes stay canonical; architecture desk remains primary Working surface.

**Security:** ReadAuthority gates list access; sealed immutability unchanged. No new public exposure; manifest detail boundary per ADR 0037 catalog rules.

**Operations:** Support bundle and on-call cite list path + decision register help. Redirect table documents legacy URLs.

**Cost:** Documentation, nav, and Vitest ratchets — no new Azure services or LLM paths.

**Teams:** GTM sponsor routes stay separate (DI-021 skip). Guided owners keep eval unlock semantics.

## Consequences

- **Positive:** 0095 is merge-blocking for “where is the sealed ledger?” — answer is Governance inventory, not a 404 parent.
- **Negative:** Nav duplication pilot vs governance until product consolidates; help aliases must stay current.
- **Follow-ups:** DI-002+ inventories; DI-023 help topic; DI-024 close audit; successor **CE** wave for cheap what-if runner.
