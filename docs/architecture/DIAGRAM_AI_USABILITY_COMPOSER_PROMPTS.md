> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that use **AI to improve human usability of diagramming** by compiling intent into existing view/model controls. Internal engineering only — not buyer-facing copy.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md) · **Decide-path contract:** [`../library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md`](../library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md) · **Plane:** [`../library/INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md)
> **Paste files:** [`.cursor/prompts/diagram-ai-usability-00-index.md`](../../.cursor/prompts/diagram-ai-usability-00-index.md) (one numbered file per session).
>
> **Do not** re-run **IDH**, **IDG**, **IDL**, **IDS**, **IDT**, **IE-16–IE-22** renderer/collector bodies, or **AS** parser waves. Do **not** retune Mermaid `nodeSpacing`. Do **not** make vision default-on.

# DAU-01–DAU-12 — Diagram AI usability (compile, don’t redraw)

**Observed (2026-09-13):** Owner asked how AI could make diagramming more usable (ideas only). Current surfaces: review Architecture diagram (generate from brief, inferred accept/remove, Mermaid textarea editor, dual-pane highlight); inventory diagrams (mode dropdown, peel, neighborhood seed, outline table, zoom); ingest (structured parse vs NotVerifiable pixels); optional vision API (default off); reconcile table; Ask `DiagramGap`.

**Product framing (locked):** AI is a **compiler** into modes, peel, seeds, camera, model patches, and citations. LLM-authored Mermaid is **not** the diagram of record. Layout stays IDH/IDG/IE-17. Pixels stay ADR **0084**.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| No merge-blocking assist rule | **DAU-01** | Next agent emits Mermaid from chat |
| Ask cannot return a view | **DAU-02** | Operators still pick `mermaidMode` by folklore |
| Plan not applied; hairball first paint | **DAU-03** | Dropdown remains the only door |
| Highlight without fit | **DAU-04** | Selected box lost at 30% zoom |
| Outline without narration | **DAU-05** | Picture has no caption |
| No X→Y trace | **DAU-06** | Neighborhood is not a path |
| Dual-pane mute | **DAU-07** | Finding location without why |
| Reconcile is a table | **DAU-08** | Mental join of rows to boxes |
| Edit = Mermaid source | **DAU-09** | Over-promises a modeling platform |
| Inferred list; regenerate wipe | **DAU-10** | Architects stop editing |
| Vision API, no accept desk | **DAU-11** | PNGs stay a dead NotVerifiable band |
| Honesty | **DAU-12** | “We analyze your PNG” regresses |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **DAU-01** ADR 0101 | First | trunk |
| **DAU-02** Ask `ViewPlan` | After 01 | DAU-01 |
| **DAU-03** Apply + density coach | After 02 | DAU-02 |
| **DAU-04** Smart camera | After 03 | DAU-03 (same viewer files) |
| **DAU-05** Walkthrough / explain | After 04 | DAU-04 |
| **DAU-06** Path highlight | After 05 | DAU-05 |
| **DAU-07** Finding spotlight | After 04 | Dual-pane files free |
| **DAU-08** Reconcile overlay | After 04 | Reconcile workbench free |
| **DAU-09** NL model patches | After 01 | Review diagram model |
| **DAU-10** Inferred + merge | After 09 | DAU-09 |
| **DAU-11** Vision side-by-side | After 01 | IE-20 API |
| **DAU-12** Close | Last | whatever actually landed |

**Run one prompt per chat.** Feature branch per prompt (`cursor/diagram-ai-usability-<short-name>-69da`). This prompt-set PR lives on `cursor/diagram-ai-usability-prompts-69da`.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: before editing a tracked file run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip that path and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- AI **cannot** mint resources from pixels (R5). AI **cannot** promote InsufficientEvidence to Confirmed. Vision **default off**.

### Locked facts (do not re-diagnose)

- Inventory modes already exist: Executive, Network, Identity, Data, Full subscription, Resource Group, Dependency neighborhood (`INFRA_DIAGRAMS_MODE_OPTIONS`).
- Peel budgets already exist (`MermaidDiagramReadabilityThresholds` MaxNodes 400).
- Review edit is Mermaid source (`ArchitectureDiagramEditor`); versions may be device-local.
- Vision ingest POST exists; `ArchLucid:DiagramVision:Enabled` defaults false.
- Dual-pane already highlights by node id or label heuristic.
- Reconcile AI rationale is already limited to Possible/Unknown.

## Out of wave

C4 morph; change-impact preview; declaration-omission conversation; sponsor display names; snapshot-to-snapshot walkthrough; unlabeled Visio namer; Lucid-class canvas.

---

# DAU-01 — ADR 0101 compile-to-controls

**Depends on:** none · **Branch:** `cursor/diagram-ai-usability-adr-0101-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-01-adr-compile-to-controls.md`](../../.cursor/prompts/diagram-ai-usability-01-adr-compile-to-controls.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: add ADR 0101 — AI diagram assist compiles into existing view tokens, model patches, and citations. LLM Mermaid is not the diagram of record. Vision stays default off. Do not mint resources from pixels. Do not implement DAU-02–12 product UI.

Read first: .cursor/prompts/diagram-ai-usability-00-index.md and diagram-ai-usability-01-adr-compile-to-controls.md; docs/architecture/adrs/template.md; README.md numbering (0101); ADR 0084 (do not rewrite the body).

Working-tree check before tracked edits. Implement only What to build in the paste file.
```

---

# DAU-02 — Ask ViewPlan

**Depends on:** DAU-01 · **Branch:** `cursor/diagram-ai-usability-view-plan-ask-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-02-view-plan-ask.md`](../../.cursor/prompts/diagram-ai-usability-02-view-plan-ask.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Infrastructure Ask returns a validated DiagramViewPlan (closed mermaidMode set). Simulator maps keywords deterministically. Unknown seeds are insufficient evidence, not invented ARM ids. Do not navigate the diagrams workbench (DAU-03). Do not emit Mermaid from Ask.

Read first: .cursor/prompts/diagram-ai-usability-02-view-plan-ask.md; InfraEvidenceAskIntentResolver; InfraEvidenceAskResponse; INFRA_DIAGRAMS_MODE_OPTIONS.

Working-tree check. OpenAPI snapshot only if the response DTO ships. Tests: FullyQualifiedName~InfraEvidenceAsk plus ViewPlan validator tests.
```

---

# DAU-03 — Apply ViewPlan + density coach

**Depends on:** DAU-02 · **Branch:** `cursor/diagram-ai-usability-density-coach-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-03-workbench-apply-and-density-coach.md`](../../.cursor/prompts/diagram-ai-usability-03-workbench-apply-and-density-coach.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Ask Apply this view writes existing diagrams query params. Partitioned/too-large first paint offers Executive, Resource Group, and neighborhood (existing seed dialog) — no fourth mode. Explicit click; do not auto-apply. Do not implement smart camera (DAU-04).

Read first: diagram-ai-usability-03-workbench-apply-and-density-coach.md; DiagramsWorkbenchClient; InfrastructureAskClient; infra-evidence-diagrams-filter-url.ts.

Working-tree check. Focused Vitest only.
```

---

# DAU-04 — Smart camera

**Depends on:** DAU-03 · **Branch:** `cursor/diagram-ai-usability-smart-camera-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-04-smart-camera.md`](../../.cursor/prompts/diagram-ai-usability-04-smart-camera.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: fit camera to selected node plus one-hop visible neighbors using mapped SVG bbox (never unmapped getBBox). Preserve IDH-02 zoom reset on mermaidSource change. Do not retune nodeSpacing. Do not add svg-pan-zoom.

Read first: diagram-ai-usability-04-smart-camera.md; ArchitectureDiagramViewer; help-mermaid.ts; IDG-04 if Graphviz SVG is present.

Working-tree check. Focused Vitest.
```

---

# DAU-05 — Walkthrough and click-to-explain

**Depends on:** DAU-04 · **Branch:** `cursor/diagram-ai-usability-walkthrough-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-05-walkthrough-and-explain.md`](../../.cursor/prompts/diagram-ai-usability-05-walkthrough-and-explain.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: deterministic walkthrough from outline/AST counts and click-to-explain using provenance classes. Do not invent ARM ids. LLM narration default off. Do not implement path highlight (DAU-06).

Read first: diagram-ai-usability-05-walkthrough-and-explain.md; parse-infra-evidence-mermaid-outline.ts; architecture-diagram-provenance.ts.

Working-tree check. Focused Vitest.
```

---

# DAU-06 — Path highlight

**Depends on:** DAU-05 · **Branch:** `cursor/diagram-ai-usability-path-highlight-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-06-path-highlight.md`](../../.cursor/prompts/diagram-ai-usability-06-path-highlight.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: shortest path on visible (non-layout-only) diagram edges. Ambiguous endpoints are insufficient, not guessed ARM ids. Do not add arrows to invent a path. Layout-only ~~~ must not be used.

Read first: diagram-ai-usability-06-path-highlight.md; DiagramEdgeVisibility; DiagramNeighborhoodSeedResolver.

Working-tree check. dotnet test filter DiagramVisiblePathFinder plus focused Vitest.
```

---

# DAU-07 — Finding spotlight narration

**Depends on:** DAU-04 · **Branch:** `cursor/diagram-ai-usability-finding-spotlight-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-07-finding-spotlight-narration.md`](../../.cursor/prompts/diagram-ai-usability-07-finding-spotlight-narration.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: one or two grounded sentences when a dual-pane finding maps to a diagram node. Label-heuristic must not claim a package citation. No new finding engine (AS-041).

Read first: diagram-ai-usability-07-finding-spotlight-narration.md; architecture-findings-dual-pane.ts; ArchitectureFindingsDualPane.tsx.

Working-tree check. Focused Vitest.
```

---

# DAU-08 — Reconcile overlay

**Depends on:** DAU-04 · **Branch:** `cursor/diagram-ai-usability-reconcile-overlay-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md`](../../.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: paint MatchKind on diagram nodes from existing correspondence rows. AI rationale remains Possible/Unknown only. Conflict must not look Confirmed. Do not change matcher rules.

Read first: diagram-ai-usability-08-reconcile-overlay.md; infra-evidence-diagram-reconcile-explanation.ts; DiagramsWorkbenchClient / DiagramReconcileWorkbenchClient.

Working-tree check. Focused Vitest.
```

---

# DAU-09 — NL model patches

**Depends on:** DAU-01 · **Branch:** `cursor/diagram-ai-usability-nl-patches-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-09-nl-model-patches.md`](../../.cursor/prompts/diagram-ai-usability-09-nl-model-patches.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: natural-language patches against ArchitectureDiagramModel; mermaid is re-emitted from the model after accept. LLM mermaid fences are not saved. Keep Edit Mermaid source as power-user. Do not mint inventory resources. Do not implement regenerate merge (DAU-10).

Read first: diagram-ai-usability-09-nl-model-patches.md; architecture-diagram-model.ts; ArchitectureDiagramEditor.tsx; use-architecture-diagram-panel.ts.

Working-tree check. Focused Vitest.
```

---

# DAU-10 — Inferred reasons + regenerate merge

**Depends on:** DAU-09 · **Branch:** `cursor/diagram-ai-usability-inferred-merge-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-10-inferred-and-regenerate-merge.md`](../../.cursor/prompts/diagram-ai-usability-10-inferred-and-regenerate-merge.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: inferred rows show why (section/span or honest absence). Regenerating a user-edit version opens a three-way merge; user-only nodes are not dropped without discard. Do not implement vision UI.

Read first: diagram-ai-usability-10-inferred-and-regenerate-merge.md; ArchitectureDiagramInferredPanel.tsx; architecture-diagram-generate.ts.

Working-tree check. Focused Vitest.
```

---

# DAU-11 — Vision opt-in side-by-side

**Depends on:** DAU-01, IE-20 API · **Branch:** `cursor/diagram-ai-usability-vision-desk-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-11-vision-opt-in-side-by-side.md`](../../.cursor/prompts/diagram-ai-usability-11-vision-opt-in-side-by-side.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Working opt-in interpret dialog for pixel NotVerifiable files — per-shape accept, honesty strip, vision flag stays default false. Do not add image/* to authority documents. Do not auto-POST.

Read first: diagram-ai-usability-11-vision-opt-in-side-by-side.md; VisionDiagramHonestyLabels; DiagramVisionOptions; ArchitectureDiagramVisionIngestController.

Working-tree check. Focused Vitest + existing vision tests if C# changes.
```

---

# DAU-12 — Honesty ratchet and close

**Depends on:** DAU-01–11 as landed · **Branch:** `cursor/diagram-ai-usability-close-69da`

**Paste file:** [`.cursor/prompts/diagram-ai-usability-12-honesty-ratchet-and-close.md`](../../.cursor/prompts/diagram-ai-usability-12-honesty-ratchet-and-close.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: acceptance file with honest Shipped/Partial/Not started rows; tests that vision default stays false and NL patches cannot save LLM mermaid as SoT. Do not implement skipped product prompts. Do not list GTM M-90/M-44/M-91/M-92 as engineering gaps. Do not reopen TB-135/TB-136.

Read first: diagram-ai-usability-12-honesty-ratchet-and-close.md; ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md honesty CI section.

Working-tree check. Tests you add only.
```
