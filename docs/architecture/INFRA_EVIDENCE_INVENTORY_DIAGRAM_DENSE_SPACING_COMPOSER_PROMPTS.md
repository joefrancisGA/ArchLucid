> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts for **residual** inventory-diagram node spacing after **IDS-01–04** (#3154) and **IDL-07** (#3160) landed. Internal engineering only.
>
> **Paste files:** [`.cursor/prompts/inventory-diagram-dense-spacing-00-index.md`](../../.cursor/prompts/inventory-diagram-dense-spacing-00-index.md) (one numbered file per session).

# IDT-01–IDT-04 — Inventory diagram spacing still too loose (follow-up)

**Observed:** Inventory diagrams (`/governance/infrastructure/diagrams`), snapshot `bebca1aa-…` (889 resources). **Executive** (or rendered **Dependency neighborhood**): green render, real peering edges, but nodes and connectors still feel too far apart — scroll across a white sea.

**Prior wave:** [`INFRA_EVIDENCE_INVENTORY_DIAGRAM_SPACING_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_INVENTORY_DIAGRAM_SPACING_COMPOSER_PROMPTS.md) (**IDS-01–04**) — shipped #3154. **IDL-07** (#3160) improved zero-edge crop but **loosened** Mermaid gaps from `24/28/8` to `28/32/10`.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| IDL-07 loosened IDS-01 dagre gaps | **IDT-01** | Nodes/ranks stay 17–25% farther than IDS target |
| One `~~~` link for 5 packing components | **IDT-02** | `alpack_*` clusters spread horizontally |
| Sparse Playwright ratchet too loose | **IDT-03** | Regression returns without owner screenshot |
| Dagre compound cluster margin | **IDT-04** | Transparent chrome still reserves wide bbox |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDT-01** Tighten Mermaid gaps | Parallel with 02 | IDS-01, IDL-07 on trunk |
| **IDT-02** Dense component grid links | Parallel with 01 | IDS-02 on trunk |
| **IDT-03** Tighten sparse-peering ratchet | After 02 | IDT-02 fixture |
| **IDT-04** Minimize alpack cluster margin | After 02 | IDT-02 |

**Run one prompt per chat.** Feature branch per prompt (`cursor/inventory-diagram-dense-spacing-<short-name>-49ba`).

## Deploy check (before coding)

Confirm SecureNow build identity includes **#3154** and **#3160**. If not deployed, spacing may still be pre-IDS (`48/56/18` + basis + tight-tree) — deploy first.

---

# IDT-01 — Tighten Mermaid dagre gaps

**Branch:** `cursor/inventory-diagram-dense-spacing-tight-gaps-49ba`

**Paste file:** [`.cursor/prompts/inventory-diagram-dense-spacing-01-tighten-mermaid-gaps.md`](../../.cursor/prompts/inventory-diagram-dense-spacing-01-tighten-mermaid-gaps.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: undo IDL-07's spacing loosening and apply the owner-tight Mermaid gap band (16/20/6 default) in architecture-diagram-mermaid-config.

Owner follow-up (do not re-diagnose): IDS fixed spacing; IDL-07 reverted gaps to 28/32/10. Nodes still too far apart on Executive sparse peering.

Do not re-run IDS-02 packer or help-mermaid crop. Do not touch ArtifactSynthesis.

Read first:
- .cursor/prompts/inventory-diagram-dense-spacing-00-index.md
- .cursor/prompts/inventory-diagram-dense-spacing-01-tighten-mermaid-gaps.md
- archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts

Working-tree check before tracked edits.

Work: implement only "What to build" in the paste file.

Tests: cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-mermaid-config.test.ts
```

---

# IDT-02 — Complete component grid links

**Branch:** `cursor/inventory-diagram-dense-spacing-grid-links-49ba`

**Paste file:** [`.cursor/prompts/inventory-diagram-dense-spacing-02-complete-component-grid-links.md`](../../.cursor/prompts/inventory-diagram-dense-spacing-02-complete-component-grid-links.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: DiagramSparseComponentPacker must emit a full mesh of layout-only ~~~ links between component representatives (horizontal + vertical), not one vertical link for 5 components.

Do not touch archlucid-ui except regenerating elevenVnetSparsePeeringMermaid() golden fixture.

Read first:
- .cursor/prompts/inventory-diagram-dense-spacing-02-complete-component-grid-links.md
- ArchLucid.ArtifactSynthesis/Compilers/DiagramSparseComponentPacker.cs
- ArchLucid.ArtifactSynthesis/Compilers/DiagramPeerGridPlanner.cs

Working-tree check before tracked edits.

Tests: dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramSparseComponentPacker|FullyQualifiedName~DiagramPeerGridPlanner'
```

---

# IDT-03 — Tighten sparse-peering ratchet

**Branch:** `cursor/inventory-diagram-dense-spacing-ratchet-49ba`

**Paste file:** [`.cursor/prompts/inventory-diagram-dense-spacing-03-tighten-sparse-peering-ratchet.md`](../../.cursor/prompts/inventory-diagram-dense-spacing-03-tighten-sparse-peering-ratchet.md)

Depends on IDT-02 golden fixture.

---

# IDT-04 — Minimize alpack cluster margin

**Branch:** `cursor/inventory-diagram-dense-spacing-cluster-margin-49ba`

**Paste file:** [`.cursor/prompts/inventory-diagram-dense-spacing-04-minimize-alpack-cluster-margin.md`](../../.cursor/prompts/inventory-diagram-dense-spacing-04-minimize-alpack-cluster-margin.md)

Depends on IDT-02.
