> **Scope:** Living platform architecture handbook — Markdown spine; DOCX generated via Pandoc.
> **Spine doc:** [`../../START_HERE.md`](../../START_HERE.md) · **Diagrams:** [`../architecture_diagrams/README.md`](../architecture_diagrams/README.md)

# ArchLucid architecture handbook

**Version:** [`VERSION`](VERSION) (current: `2026.08.17a`)

## Generate / release

```powershell
# Preferred one-shot (temp-copy mermaid render + Full + Buyer + Security + drift):
.\scripts\docs\release-architecture-handbook.ps1

# Or packs only (PNGs already present):
.\scripts\docs\generate-architecture-handbook-docx.ps1 -Pack Full -SkipPngRender
.\scripts\docs\generate-architecture-handbook-docx.ps1 -Pack Buyer -SkipPngRender
.\scripts\docs\generate-architecture-handbook-docx.ps1 -Pack Security -SkipPngRender
```

CI: `.github/workflows/architecture-handbook.yml` (drift + best-effort DOCX artifact upload).

## Static gallery

[`site/index.html`](site/index.html)

## Chapter map (Full)

| # | File | Focus |
|---|------|-------|
| 00–15 | prior chapters | Core + stages + threats |
| 16 | [`16-data-model-er.md`](16-data-model-er.md) | ER |
| 17 | [`17-config-precedence.md`](17-config-precedence.md) | Config |
| 18 | [`18-authn-route-matrix.md`](18-authn-route-matrix.md) | AuthN tiers |
| 19 | [`19-pilot-day0-day1.md`](19-pilot-day0-day1.md) | Pilot wireflow |
| 20 | [`20-finops-cost.md`](20-finops-cost.md) | Cost drivers |
| 21 | [`21-observability-map.md`](21-observability-map.md) | OTel / metrics |
| 22 | [`22-dr-failover-drill.md`](22-dr-failover-drill.md) | DR drill |
| 23 | [`23-policy-pack-sdlc.md`](23-policy-pack-sdlc.md) | Pack authoring |
| 24 | [`24-api-surface-heatmap.md`](24-api-surface-heatmap.md) | API heat map |
| 25–34 | evidence → simulator matrix | Expansion set 3 |
| 35–44 | extractors → Terraform order | Expansion set 4 |
| 45–54 | LLM adapters → rate limiting | Expansion set 5 |
| 55–64 | Private Link → hosting roles | Expansion set 6 |
| 65–74 | idempotency → technology ledger | Expansion set 7 |
| 75 | [`75-architecture-and-review-engines.md`](75-architecture-and-review-engines.md) | Formal spec: synthesis vs review-evaluation kernels, finding engines, unsatisfied boundaries |
| 98–99 | changelog / refs | — |

Standalone Word export of chapter 75 plus remediation prompts: [`../ARCHITECTURE_AND_REVIEW_ENGINES.docx`](../ARCHITECTURE_AND_REVIEW_ENGINES.docx).

Buyer pack: [`buyer/`](buyer/). Security reviewer pack: [`security/`](security/).
