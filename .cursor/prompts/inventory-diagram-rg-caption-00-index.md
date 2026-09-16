<!-- Inventory-diagram resource-group captions — Composer prompts.
     Paste one numbered file per session. Origin: 2026-09-15 owner Full
     subscription inventory-forest canvas: hundreds of resource cards, no RG
     frames, no RG text on the cards. Easiest useful slice: print ArmResourceGroup
     on each forest card. Do not implement from this index. -->

# Inventory-diagram resource-group captions — Composer prompt set (IDR-01–IDR-03 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams already know each node's Azure resource group (`DiagramNode.ArmResourceGroup`, Nodes outline **Resource group** column, Mermaid `%% al-rg` comments). The **inventory-forest** canvas the owner sees on Full subscription does not print that name on the card.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-rg-caption-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_RG_CAPTION_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_RG_CAPTION_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not implement resource-group bounding boxes, RG-aware packing, nested VNet/subnet frames, or a Graphviz-primary Full subscription path from this set.** That is a later layout wave. This set is **captions only**.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IE-ND, IE-ID, or IE-DD** inside an IDR session.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees (2026-09-15)

Inventory diagrams Full subscription (or equivalent leaf inventory forest): a dense **four-column** grid of same-size cards (icon + resource name). A subscription node may sit at the top. Almost no connectors. **No resource-group bounding boxes. No resource-group text on the cards.**

The Nodes outline already has a **Resource group** column. Render status may still report subgraphs. The live canvas is **inventory-forest** (`DiagramForestLayoutSvgRenderer`), which places nodes by connected component and **ignores RG subgraphs** except to skip `alpack_*`.

### Why boxes are the wrong first prompt

Forest packing does not cluster by resource group. Drawing rectangles around `ArmResourceGroup` membership on the current grid would overlap. RG-aware packing is a real layout wave. This set does **not** start it.

### Causal chain (locked)

1. `DiagramAstFromGraphCompiler` already stamps `ArmResourceGroup` from inventory.
2. `DiagramNodeHumanCaptionFactory` prints name + friendly type. It does **not** put the RG on the card or in the SVG `<title>`.
3. `DiagramForestCanvasLabelContext` / `DiagramForestNodeSvgEmitter` draw pictogram + wrapped **name** only.
4. Server **Download PNG** for `inventory-forest` still goes through Graphviz HTML labels (`DiagramGraphvizHtmlNodeLabel`), which also omit the RG. Canvas and PNG must not diverge.

**Signature (fail this wave if still true after IDR-01–03):** a forest SVG node with non-empty `ArmResourceGroup` has no resource-group text on the card and no RG in the SVG `<title>`; or Graphviz HTML for that node still omits the RG.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Caption** | Name + type only | Optional `ResourceGroupCaption`; SVG `<title>` includes ` · {rg}` | IDR-01 |
| **Forest card** | Name lines only | Muted second line with the RG, height grows by that line | IDR-02 |
| **PNG / Graphviz HTML** | Bold name + type | Same RG line so Download PNG matches the canvas | IDR-03 |

## What this set does *not* change

Keep: inventory-forest packing by connected component. Sparse flatten on Executive / Network / Data / Identity. Full subscription RG subgraphs in the AST (still unpainted as boxes). Resource group map collapse. **Pick a Resource Group** filter. `%% al-rg` comments. Outline **Resource group** column. Export Mermaid topology. Help-topic `MermaidDiagram`. `alpack_*` remains deleted.

Do **not** wrap nodes in RG clusters in forest SVG. Do **not** `OrderBy` the forest exclusively by RG if that changes owner-shape column tests — captions only. Do **not** retune `nodeSpacing`. Do **not** hide desktop review workspace tabs.

## Run order

**01 → 02 → 03.**

- **01** caption record + factory. No SVG geometry change required (title string only). May land without 02, but do not ship 01 to production without 02 — a tooltip-only RG is not the owner ask.
- **02** needs 01 (`ResourceGroupCaption`).
- **03** needs 01. May start in parallel with 02 (no file overlap if 03 only touches `DiagramGraphvizHtmlNodeLabel` + its tests). Merge 02 before calling the wave done.

**IDR-HOLD** is not implementation. Paste `inventory-diagram-rg-caption-04-hold.md` only if a session starts drawing bounding boxes, RG-aware packing, flatten changes, or Graphviz-as-primary Full subscription.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-rg-caption-<short-name>-c9e4`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-rg-caption-prompts-c9e4`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-rg-caption-01-human-caption.md` | Caption/tooltip have no RG |
| 02 | `inventory-diagram-rg-caption-02-forest-card-line.md` | Forest cards show icon + name only |
| 03 | `inventory-diagram-rg-caption-03-graphviz-png-parity.md` | PNG HTML labels omit the RG the canvas just gained |
| HOLD | `inventory-diagram-rg-caption-04-hold.md` | Bounding-box / packing temptation |

## Follow-on (do not implement from this file)

RG **bounding boxes** on Full subscription require forest to pack by resource group, then draw frames. That is **IDA-08**, not IDR. Do not start it from an IDR chat. Do not treat IDR captions as “resource groups are shown on diagrams” in the bounding-box sense.

## After each prompt

Summarize: files changed, tests run, whether a Full subscription forest card with `ArmResourceGroup = "rg-app-prod"` would show that string on the card (02) and in Graphviz HTML (03), residual risk (scattered same-RG cards, extra card height).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case.
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` named in the prompt. No full-solution build unless the file says so.
- Implement only *What to build*.
