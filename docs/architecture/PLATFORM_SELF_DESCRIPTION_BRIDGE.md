> **Scope:** How ArchLucid’s product self-description surfaces relate to (and differ from) in-repo platform meta-docs.
> **Spine doc:** [`../START_HERE.md`](../START_HERE.md) · **Capabilities:** [`PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md`](PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md) · **Handbook:** [`architecture_handbook/README.md`](architecture_handbook/README.md)

# Platform self-description bridge

## Problem

Operators and buyers encounter **two** “descriptions of architecture”:

1. **Product** — review packages, golden manifests, Mermaid artifacts from a **customer run**, Ask/RAG answers grounded in tenant corpus, CLI `graph export`.
2. **Platform meta-docs** — this handbook, zoom-in diagrams, C4 DSL, ADRs — describing **ArchLucid itself**.

Confusing them creates false expectations (“why doesn’t the product export the platform handbook?”) or false claims (“the handbook is a customer deliverable”).

## Bridge rules

| If you need… | Use… |
|--------------|------|
| Document ArchLucid the product platform | `architecture_handbook/` + `architecture_diagrams/` + ADRs |
| Document a customer’s system under review | Authority pipeline + product exports |
| C4 for Structurizr / enterprise architecture tooling | `docs/c4/workspace.dsl` (sync via [`C4_MERMAID_SYNC.md`](C4_MERMAID_SYNC.md)) |
| ADR-linked zoom-ins | [`DIAGRAM_ADR_OVERLAY.md`](DIAGRAM_ADR_OVERLAY.md) |
| Buyer-safe short excerpt | `architecture_handbook/buyer/` pack |

## Product surfaces that look like “self-description”

- In-app help / Learn more (product UX copy — not the Word handbook).
- Trust center and GTM isolation pages (buyer claims — must stay aligned with ADR 0037).
- Run-scoped Mermaid / graph export (customer evidence graph — not platform C4).

## Coding-agent implication

Prefer editing **repo meta-docs** when the question is “how does ArchLucid work?”  
Prefer **not** inventing customer architecture packages in Markdown when the product pipeline should own that artifact.

See [`PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md`](PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md) for the full capability matrix.
