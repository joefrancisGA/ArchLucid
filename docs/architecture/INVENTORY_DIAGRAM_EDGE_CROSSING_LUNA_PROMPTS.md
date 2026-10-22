> **Scope:** Paste-ready GPT-5.6 Luna prompts. Shrink inventory-diagram edges that cut through unrelated cards. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/edge-crossing-01-hide-fanout.md`](../../.cursor/prompts/edge-crossing-01-hide-fanout.md), [`.cursor/prompts/edge-crossing-02-seat-groups.md`](../../.cursor/prompts/edge-crossing-02-seat-groups.md), [`.cursor/prompts/edge-crossing-03-gutter.md`](../../.cursor/prompts/edge-crossing-03-gutter.md)

# Inventory diagram edge crossings — Luna prompts

**Created:** 2026-09-24 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

`DiagramForestOrthogonalEdgeRouter` already treats other cards as obstacles. When no short orthogonal path is clear it draws the first elbow through those cards (`UsedFallback`). On a Full subscription canvas the edges that do this are cross-group `likely · applies` and `likely · connected to` lines, often with a third resource group between the ends.

| ID | Prompt | Intent |
|----|--------|--------|
| **XC-01** | [edge-crossing-01-hide-fanout.md](../../.cursor/prompts/edge-crossing-01-hide-fanout.md) | Default off: cross-group `applies` and `likely ·` edges. Checkbox **Show cross-group links**. Same-group edges stay. |
| **XC-02** | [edge-crossing-02-seat-groups.md](../../.cursor/prompts/edge-crossing-02-seat-groups.md) | Resource groups that share a painted edge sit side by side. |
| **XC-03** | [edge-crossing-03-gutter.md](../../.cursor/prompts/edge-crossing-03-gutter.md) | Remaining edges use the gap between frames or columns. The current router stays. |

Run **XC-01**, then **XC-02**, then **XC-03**.

## Do not pull into these sessions

- An A* search, a visibility graph, or Graphviz `dot` as the live canvas
- A change to `ComponentHorizontalGap` or `ComponentVerticalGap`
- Subnet boxes, VNet caption icons, or a new icon pack
- Re-running **VN-01–VN-06**, **IDX**, **IDA**, **IDF**, **IDR**, **IE-ND**, or **AX-DE** as greenfield
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
