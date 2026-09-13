> **Scope:** Contributor-reference — written hold for inventory-diagram Graphviz layout (**IDG**). Internal engineering only.
> **Spine:** [`INFRA_EVIDENCE_PLANE.md`](INFRA_EVIDENCE_PLANE.md) · **Prompts:** [`../architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md`](../architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md)

# Graphviz layout hold (IDG)

**Status:** Active written hold — **not implementation**. Paste [`.cursor/prompts/inventory-diagram-graphviz-06-hold.md`](../../.cursor/prompts/inventory-diagram-graphviz-06-hold.md) only when a session starts extractor DOT, ARM `dependsOn` as architecture, a second collector, or Graphviz `dot` as the default engine.

## Authorized spine (IDG-01–IDG-05)

```text
Azure inventory snapshot graph
    → DiagramAst (existing compiler)
    → Graphviz DOT (fdp, visible edges only)
    → fdp -Tsvg (sanitized)
    → Inventory diagrams canvas
Mermaid from the same DiagramAst remains Export Mermaid / fail-soft
```

## Do not implement (ever from IDG sessions)

| Temptation | Hold |
|-----------|------|
| PowerShell / ARM export → `.dot` | Extractor is evidence; layout is a renderer |
| `dependsOn` as `A -> B` | Deploy DAG, not topology (**IE-RF-12**) |
| Second collector for diagrams | Plane: one family |
| Azure HTTP at render time | Append-only snapshots |
| Default engine `dot` | Same layered spread as dagre |
| Another Mermaid gap-constant pass | Already 16/20/6; not the failure |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IDG-01–IDG-05**.
