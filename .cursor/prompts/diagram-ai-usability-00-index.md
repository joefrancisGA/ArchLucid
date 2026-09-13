<!-- Diagram AI usability — Composer prompts. Paste one numbered file per
     session. Origin: 2026-09-13 owner request to evaluate AI for human
     usability of diagramming (ideas only), then generate a prompt set.
     Do not implement from this index. -->

# Diagram AI usability — Composer prompt set (DAU-01–DAU-12)

ArchLucid sells a **seat for a repeat professional**. Diagramming is already a structured graph (review `ArchitectureDiagramModel` / inventory `DiagramAst`) plus peel, modes, neighborhood seed, dual-pane highlight, reconcile rows, and optional vision ingest. Humans still cannot *use* those controls: they pick `mermaidMode` from a dropdown, edit **Mermaid source**, or stare at a hairball at 30% zoom.

**This set is not another layout-constant pass.** **IDH** / **IDG** own packing and Graphviz `fdp`. **AS-001–AS-045** own diagrams-on-decide. **IE-16–IE-22** own Mermaid, ingest, reconcile, Ask, and vision (default off). **DAU** owns **AI as a compiler into those existing controls**.

**Owner authorization (this wave):** Make diagrams usable with AI **without** LLM-emitted Mermaid as source of truth, **without** default-on vision, **without** minting resources from pixels (R5 / ADR 0084), and **without** a Lucid-class infinite canvas.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/diagram-ai-usability-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc: [`docs/architecture/DIAGRAM_AI_USABILITY_COMPOSER_PROMPTS.md`](../../docs/architecture/DIAGRAM_AI_USABILITY_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not re-run IDH, IDG, IDL, IDS, IDT, IE-16–IE-22 collector/renderer bodies, or AS parser waves.** Call their types and URLs. Do not retune `nodeSpacing`. Do not collapse desktop review workspace tabs.

## Kernel (locked)

**Human intent → closed view/model tokens → deterministic render.**

| Allowed AI output | Forbidden AI output |
|-------------------|---------------------|
| `DiagramViewPlan` whose `mermaidMode` is one of `executive` / `network` / `identity` / `data` / `full` / `resourceGroup` / `dependencyNeighborhood` | Freeform Mermaid / DOT / SVG as the diagram of record |
| Seed / RG / snapshot / fit-target ids that already exist on the outline or inventory | Invented ARM ids, CloudResourceIds, or graph nodes |
| Model **patches** (`ArchitectureDiagramModelRecord` node/edge add/remove/relabel) with provenance `user-drawn` or `inferred`, awaiting accept | Silent regenerate that wipes a hand edit |
| Narration grounded on outline / AST / correspondence rows / `diagram:` citations | Pixel-as-prose topology; “we analyzed your PNG” unless `ExtractionMethod=VisionOptIn` actually ran |
| AI rationale on reconcile **Possible / Unknown** only (IE-19) | Flipping InsufficientEvidence → Confirmed |

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Kernel ADR** | AI-on-diagrams is undocumented folklore | ADR **0101**: assist compiles into existing controls | DAU-01 |
| **Intent-to-view** | Operator picks mode/seed; Ask `DiagramGap` only explains gaps | Ask returns a validated `ViewPlan`; workbench applies it | DAU-02, DAU-03 |
| **First paint** | Partitioned / hairball / persisted 30% zoom | Named exits + camera on the relevant subgraph | DAU-03, DAU-04 |
| **Reading** | Outline table + provenance panel | Walkthrough, click-to-explain, path highlight | DAU-05, DAU-06 |
| **Decide** | Dual-pane highlight; reconcile is a table | Spotlight narration; MatchKind paint on the canvas | DAU-07, DAU-08 |
| **Author** | Mermaid textarea; inferred accept/remove list; regenerate fights edits | NL model patches; explained inferred; 3-way merge | DAU-09, DAU-10 |
| **Pixels** | Vision API exists, default off, no desk accept UX | Opt-in side-by-side per-shape accept; honesty strip | DAU-11 |
| **Close** | Marketing could claim PNG analysis | Honesty ratchet + acceptance file | DAU-12 |

## What this set does *not* change

Keep: one Azure collector. ADR **0084** structured-vs-pixel. `ArchLucid:DiagramVision:Enabled` **default false**. IE-17 peel budgets. IDH `~~~` honesty. IDG Graphviz as inventory layout backend (do not revert to dagre). Dual-pane finding→node sync. Reconcile `MatchKind` / `ConfidenceBand` rules. Simulator Ask JSON allowlist. Desktop review **tabs** as a full strip. ADR 0068 two kernels.

Do **not** add elk / svg-pan-zoom. Do **not** hide desktop review workspace tabs behind **More**. Do **not** merge `DraftRequests` and `Runs`. Do **not** unseal. Do **not** add a 40th coverage engine for “node type missing from diagram.” Do **not** ship a freeform infinite canvas. Do **not** make vision default-on.

## Out of wave (do not pretend closed)

| Residual | Why |
|----------|-----|
| C4 context/container/component morph | Same model, later labeling pass |
| Change-impact preview (“accept this finding → which boxes move”) | Needs recommendation-accept diff; follow-on |
| Declaration-omission as a conversational question | Engine exists (AS-042); UX not this wave |
| Sponsor display-name overlay | Honesty vs ARM-id disclosure already exists |
| Snapshot-to-snapshot walkthrough | IE-06 neighborhood recompute; later Ask topic |
| Unlabeled Visio shape namer | Parser residual; Possible only; not resource mint |
| Lucid/Visio-class visual editor | Product bet, not an AI compiler |

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **AS-001–AS-045** | Diagrams on decide | **Do not re-run.** DAU consumes `diagram:` citations and NotVerifiable |
| **IE-16–IE-22 / IE-UX-02 / IE-UX-03** | Mermaid, ingest, reconcile, Ask, vision API, workbenches | **Do not paste collector/renderer bodies.** Extend Ask + UI |
| **IDH-01–03 / IDG-01–05** | Human packing / Graphviz `fdp` | **Do not re-run.** Layout stays deterministic |
| **IE-19** | MatchKind + AI rationale on Possible/Unknown | **Do not rewrite** confidence rules |

## Run order

**01 → 02 → 03.** Then **04** (camera; may overlap 03 UI files — do not start 04 until 03 is merged or explicitly scoped off those lines). **05 → 06.** **07** after dual-pane files are free. **08** after reconcile workbench is free. **09 → 10.** **11** after vision API (already shipped). **12** last.

**01** must not ship product UI. **02** must not navigate the workbench (03 does). **05** must not compute paths (06 does). **09** must not invent a second diagram model family.

Suggested Cloud Agent branch per implementation prompt: `cursor/diagram-ai-usability-<short-name>-69da`. This prompt-set PR lives on `cursor/diagram-ai-usability-prompts-69da`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `diagram-ai-usability-01-adr-compile-to-controls.md` | No merge-blocking rule against LLM Mermaid / default-on vision |
| 02 | `diagram-ai-usability-02-view-plan-ask.md` | Ask cannot return a closed view plan |
| 03 | `diagram-ai-usability-03-workbench-apply-and-density-coach.md` | Hairball first paint; dropdown is the only way to change view |
| 04 | `diagram-ai-usability-04-smart-camera.md` | Selection highlight without fitting the subgraph |
| 05 | `diagram-ai-usability-05-walkthrough-and-explain.md` | Outline exists; no grounded narration |
| 06 | `diagram-ai-usability-06-path-highlight.md` | “How does X reach Y?” has no diagram answer |
| 07 | `diagram-ai-usability-07-finding-spotlight-narration.md` | Dual-pane highlights a node; does not say why |
| 08 | `diagram-ai-usability-08-reconcile-overlay.md` | Correspondence is a table, not paint |
| 09 | `diagram-ai-usability-09-nl-model-patches.md` | Edit = Mermaid textarea |
| 10 | `diagram-ai-usability-10-inferred-and-regenerate-merge.md` | Inferred list has no why; regenerate fights hand edits |
| 11 | `diagram-ai-usability-11-vision-opt-in-side-by-side.md` | Vision API has no per-shape accept desk |
| 12 | `diagram-ai-usability-12-honesty-ratchet-and-close.md` | PNG-analysis claims can regress |

## After each prompt

Summarize: files changed, tests run, whether AI can still emit Mermaid as SoT (must be **no**), whether vision stayed default-off, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` **or** skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
