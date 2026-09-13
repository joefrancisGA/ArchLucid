<!-- Inventory-diagram dense spacing — Composer prompts (follow-up wave).
     Paste one numbered file per session. Origin: 2026-09-12 owner follow-up after
     IDS-01–04 (#3154) and IDL-07 (#3160) landed: node spacing still feels too
     large on Executive sparse-peering forests. Do not implement from this index. -->

# Inventory-diagram dense spacing — Composer prompt set (IDT-01–IDT-04)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. After the **IDS** wave and **IDL-07**, the camera is honest and peering edges are real — but operators still report **nodes and connectors too far apart** on sparse Executive forests (snapshot `bebca1aa-…`, 11 VNets, 6 peerings).

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-dense-spacing-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_DENSE_SPACING_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_DENSE_SPACING_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL-01–07 or IDS-01–04 wholesale.** Those waves landed. This set closes the **residual slack** the first spacing wave and IDL-07 left behind.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees

Inventory diagrams (`/governance/infrastructure/diagrams`), snapshot `bebca1aa-9fba-408a-b9ce-2794678c4281` (889 resources). **Executive** mode (or a rendered **Dependency neighborhood** after choosing a seed): green **Render succeeded**, real peering edges in the Edges table, but the canvas still feels like a **white sea** — scroll to find the next node; connectors span hundreds of pixels.

The 2026-09-12 follow-up screenshot in Dependency neighborhood mode shows **no diagram** because no starting resource is selected. Spacing complaints refer to **rendered** Executive / neighborhood graphs on this snapshot, not the empty seed picker.

### What already shipped (why "we fixed this earlier" is true — and incomplete)

| Wave | PR | What it did |
|------|-----|-------------|
| **IDS-01–04** | #3154 | Mermaid init `24/28/8`, linear + `network-simplex`; `DiagramSparseComponentPacker` + `alpack_*` subgraphs; `resolveMermaidNodeUnionViewBox`; sparse-peering Playwright ratchet |
| **IDL-07** | #3160 | Ink crop from `g.node` only; mis-mapped partial crop guard; **reverted spacing to `28/32/10`**; peer-grid gap assertions (zero-edge fixture only) |

The owner remembers **IDS** tightening gaps. **IDL-07 loosened them again** the same day (`24→28`, `28→32`, `8→10`) while improving crop for the zero-edge grid. Sparse-peering layouts were not re-tightened.

### Causal chain (residual slack)

1. **Mermaid dagre gaps are looser than IDS-01 targets.** Current `architecture-diagram-mermaid-config.ts`: `nodeSpacing: 28`, `rankSpacing: 32`, `padding: 10`. IDS-01 spec was `24/28/8`; owner open question in IDS index was `16/20/6` if still slack.

2. **Sparse component packer under-links representatives.** `DiagramPeerGridPlanner.BuildGridLinks` links `index → index + columns`. For **5** packing components, `ResolveColumnCount(5) = 4`, so only **one** `~~~` link (`rep[0] → rep[4]`). The zero-edge 11-node grid gets **six** `~~~` links (5 columns). One vertical invisible link does not steer a 2×3 component grid — dagre still spreads `alpack_*` clusters horizontally.

3. **Compound subgraph chrome adds dagre margin.** Each 2-node peering pair sits inside `alpack_N`. Even with transparent fill/stroke, Mermaid/dagre reserves **cluster padding** between compound nodes. Five clusters on one rank with one `~~~` rank-break still produce wide horizontal separation.

4. **Sparse-peering Playwright ratchet is too loose.** `infra-diagrams-layout.mock.spec.ts` sparse case: ≥ **4** of 11 nodes visible; peering pair distance ≤ `max(280, 3.5×nodeSize)` px; viewBox ≤ **1.5×** node union. The zero-edge peer-grid test already asserts `maxHorizontalGapRatio ≤ 0.75` — sparse peering does **not**. Tests pass while the owner still sees slack.

5. **Deploy lag (check first).** If SecureNow is not on trunk ≥ #3160, the owner may still be on pre-IDS spacing (`48/56/18` + basis + tight-tree). Confirm build identity / deploy SHA before coding.

**Signature (fail this wave if still true after IDT-01–04):** Executive owner snapshot, 11 nodes · 6 edges, scroll required to see most nodes, largest horizontal gap between same-rank nodes > **0.5× node width**, or peering connector center distance > **2× node width**.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Dagre gaps** | `28/32/10` (post-IDL-07) | `16/20/6` (owner-tight band) or restore IDS `24/28/8` minimum | IDT-01 |
| **Component grid links** | One `~~~` for 5 components | Full row + column `~~~` mesh on representatives (same planner, horizontal pass) | IDT-02 |
| **Ratchet** | 4/11 visible, 280 px pairs, no gap ratio | Match peer-grid strictness on sparse-peering fixture | IDT-03 |
| **Cluster margin** | Default dagre subgraph padding | Minimize `alpack_*` cluster bbox (renderer style / Mermaid config if supported) | IDT-04 |

## What this set does *not* change

Keep: `#3013` client Mermaid compile. IDL/IDS invisible `~~~` honesty. IDL-02 zero-edge peer-grid. IDL-03 legibility floor (11 px). IDL-05 `peered` counts. Real peering `-->` edges. `flowchart TD`. No elk, no svg-pan-zoom, no LR wholesale flip. No desktop tab collapse.

Do **not** hide peering arrows to recover the zero-edge grid. Do **not** shrink labels below 11 px.

## Run order

**01 → 02 → 03 → 04.**

- **01** viewer-only (Mermaid init constants). May parallel **02**.
- **02** backend-only (packer grid links). May parallel **01**.
- **03** e2e-only (tighten thresholds; update golden fixture from 02).
- **04** viewer-only (alpack cluster margin). After **02** so golden Mermaid is stable.

Suggested branch per prompt: `cursor/inventory-diagram-dense-spacing-<short-name>-49ba`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-dense-spacing-01-tighten-mermaid-gaps.md` | IDL-07 loosened IDS-01 spacing |
| 02 | `inventory-diagram-dense-spacing-02-complete-component-grid-links.md` | One `~~~` link for 5 components |
| 03 | `inventory-diagram-dense-spacing-03-tighten-sparse-peering-ratchet.md` | Loose Playwright thresholds |
| 04 | `inventory-diagram-dense-spacing-04-minimize-alpack-cluster-margin.md` | Dagre compound subgraph padding |

## Open questions for the owner (defaults apply if unanswered)

1. **Gap band.** IDT-01 default: `nodeSpacing: 16`, `rankSpacing: 20`, `padding: 6`. Fallback if labels collide: `20/24/8`. Which band?
2. **Horizontal `~~~` between representatives on the same rank.** IDT-02 adds `rep[i] ~~~ rep[i+1]` within each grid row (layout-only). OK?
3. **Minimum visible nodes in viewport.** IDT-03 default: **8** of 11 at default zoom on the owner fixture. Stricter?

## After each prompt

Summarize: files changed, tests run, whether Executive snapshot `bebca1aa-…` renders as a **compact forest** (most nodes in default viewport, short peering connectors, no fabricated arrows), residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. No full-solution build unless the file says so.
