> **Scope:** Engineering contract for structured diagram documents on the review authority **decide** path (architecture-spine AS-003 / ADR 0084). **Contributor-reference** — internal only.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md) · **Kernel ADR:** [ADR 0084](../architecture/adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md) · **MIME inventory:** [`architecture-input-kind-inventory.ts`](../../archlucid-ui/src/lib/architecture-spine/architecture-input-kind-inventory.ts)

# Architecture review diagram input contract

## Purpose

ESI intentionally kept the authority context MIME allowlist narrow (`text/plain`, `text/markdown`). Wave 22 **reopens** that allowlist for **structured diagram JSON only** — not for raster pixels masquerading as text. This document is the reviewer-facing contract for “may these bytes enter context ingestion?”

**Reuse IE-18:** Parsed diagram topology maps into the existing **`ArchitectureDiagramModelRecord`** / `DiagramAst` family (`ArchLucid.Contracts.Architecture`, `StructuredDiagramIngestService`). Do **not** fork a third diagram model family. See [`INFRA_EVIDENCE_COMPOSER_PROMPTS_IE16_IE22.md`](../architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS_IE16_IE22.md) (**IE-18**).

---

## Allowed `ContextDocumentRequest.contentType` values

| Content type | Payload | Decide path today | Owner |
|--------------|---------|-------------------|-------|
| `text/plain` | Non-empty UTF-8 prose / line-oriented requirements | **Supported** — `PlainTextContextDocumentParser` | shipped |
| `text/markdown` | Non-empty UTF-8 markdown | **Supported** — same parser | shipped |
| `application/vnd.archlucid.diagram+json` | JSON matching **`ArchitectureDiagramModelRecord`** (nodes, edges, subgraphs/swimlanes, trust-boundary labels, `extractionMethod`, optional `sourceEvidenceItemId`) | **Supported** — `ArchLucidDiagramJsonContextDocumentParser` (AS-012); pixel stubs remain NotVerifiable (AS-004) | shipped |
| `text/vnd.mermaid` | Raw Mermaid flowchart / C4 source (`.mmd`, mermaid-looking `text/plain`) | **Supported** — `MermaidContextDocumentParser` (AS-007) | shipped |
| `application/vnd.archlucid.diagram+svg` | Sanitized SVG diagram source (`.svg`); raw `image/svg+xml` remains forbidden on authority | **Supported** — `SvgContextDocumentParser` (AS-008) | shipped |
| `application/vnd.jgraph.mxfile` | Uncompressed draw.io / diagrams.net `mxfile` XML (`.drawio`) | **Supported** — `DrawIoContextDocumentParser` (AS-009); compressed pages warn when not extracted | shipped |
| `application/vnd.ms-visio.drawing.main+xml` | Visio `.vsdx` Open Packaging zip posted as base64 (legacy `.vsd` unsupported) | **Supported** — `VsdxContextDocumentParser` (AS-010) | shipped |

Canonical C# list: **`ArchLucid.ContextIngestion.SupportedContextDocumentContentTypes.All`**.  
Canonical TS list: **`SUPPORTED_CONTEXT_DOCUMENT_CONTENT_TYPES`** in `archlucid-ui/src/lib/architecture-spine/supported-context-document-content-types.ts`.

PDF/DOCX prose extract is **not** a context `contentType` — wizard bridges extracted text as `text/plain` per [`CONTEXT_INGESTION.md`](CONTEXT_INGESTION.md).

---

## Forbidden context bytes (merge-blocking)

| Pattern | Why forbidden | Honest alternative |
|---------|---------------|-------------------|
| Any `image/*` `contentType` (`image/png`, `image/jpeg`, `image/svg+xml`, …) | Pixels are not valid context document bytes on the decide path | Store via ESI; emit structured diagram JSON or label **NotVerifiable** (ADR 0084) |
| PNG/JPEG bytes in `content` with `text/plain` or `text/markdown` | Pixel-as-prose bypasses MIME validation | Structured parse (AS-007+) or opt-in vision (AS-040, default off) |
| Empty `content` for diagram JSON | Fail-closed — no invented topology | Omit document or surface wizard validation error |
| Base64 image payloads in `content` without `ExtractionMethod` | Same as pixel-as-text | Vision opt-in only after explicit operator consent |

**Reviewers:** refuse PRs that post raster image bytes into `ArchitectureRequest.documents[]` — use stored-file catalog + structured extract instead.

---

## `ExtractionMethod` (diagram sources)

Maps to persisted diagram ingest metadata (`DiagramExtractionMethods` in C#). Contract vocabulary for desk honesty:

| Contract value | C# constant | Meaning |
|----------------|-------------|---------|
| `StructuredParse` | `DiagramExtractionMethods.StructuredParse` | Deterministic parser (mermaid, sanitized SVG, draw.io XML, `.vsdx` zip+xml, product JSON) |
| `VisionOptIn` | `DiagramExtractionMethods.VisionAi` | Working opt-in vision/OCR — **default off** (AS-040 / IE-20) |
| `None` | *(no persisted diagram model)* | Pixel-only or unsupported — **NotVerifiable** on desk; never silent drop (AS-004 / AS-005) |

---

## Honesty CI (operator / marketing copy)

The following claims are **false** unless structured extract succeeded or opt-in vision explicitly ran:

- “Attached PNG is analyzed” / “we analyze your diagram image”
- “Visio file is parsed on upload” (before AS-010 ships)
- “Screenshot topology is on the decide path” without `ExtractionMethod=StructuredParse` or `VisionOptIn`

Use TB-645 vocabulary: **NotVerifiable**, **structured diagram**, **stored for inspect**.

---

## Diagram evidence citation grammar (AS-022)

Package-resolvable citations for diagram shapes and connectors:

```text
diagram:{evidenceItemId}:{shapeOrEdgeId}
```

- `{evidenceItemId}` — optional ESI / stored-file id for the diagram source (may be empty: `diagram::api`).
- `{shapeOrEdgeId}` — stable `ArchitectureDiagramNodeRecord.id` or `ArchitectureDiagramEdgeRecord.id` from structured parse.

**Concrete evidence:** `GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation` treats a `diagram:` ref as concrete only when the shape or edge id exists on the review package (`DiagramPackageCitationIndex`). Dangling ids are **not** concrete evidence.

**Honesty (TB-1228):** `diagram:` citations are structural package anchors — not semantic faithfulness or LLM-judge proof.

## Related

- [`CONTEXT_INGESTION.md`](CONTEXT_INGESTION.md) — connector pipeline
- [`API_CONTRACTS.md`](API_CONTRACTS.md) — `ContextDocumentRequest` validation
- [`EVIDENCE_INTAKE_OPERATOR_GUIDE.md`](customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md) — operator-facing intake
- **AS-002** MIME kind inventory — wizard vs authority vs ESI lanes today
