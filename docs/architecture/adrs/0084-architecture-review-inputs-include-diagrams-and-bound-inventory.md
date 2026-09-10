> **Scope:** ADR 0084 — Architecture review inputs include structured diagrams and bound inventory snapshots (architecture-spine AS-001 / wave 22 kernel).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0084: Architecture review inputs include diagrams and bound inventory

- **Status:** Proposed
- **Date:** 2026-09-09
- **Owner decision:** Close the livelihood ontology gap — the authority pipeline must see what architects draw and operate, not only asserted prose (AS-001 / wave 22)

## Context

Working architects defend **topologies they drew** and **estates they operate**. ArchLucid's review authority pipeline today ingests **asserted text/context** well enough for prose-first packages, but treats the architect's primary artifacts as optional or invisible on the **decide** path:

- `buildIntakeContextDocumentsFromEvidenceFiles` returns **`null`** for PNG/JPEG and other non-text binaries — wizard attachments silently disappear from context documents.
- Context ingestion MIME allowlist is effectively **text/plain** and **text/markdown**; PDF/DOCX are bridged via extracted text, not structured topology.
- **ESI** (Evidence Stored Inventory) can **inspect/preview** stored files on the desk — a separate surface — but engines on the decide path never receive structured diagram nodes/edges or bound Azure inventory facts unless prose happens to mention them.
- `.vsdx`, draw.io XML, mermaid, PlantUML, and ArchLucid diagram JSON are **unsupported** on the decide path today despite being common architect deliverables.
- The infrastructure-evidence plane ([`INFRA_EVIDENCE_PLANE.md`](../../library/INFRA_EVIDENCE_PLANE.md)) already defines **one Azure collection** feeding architecture reconciliation — wave 22 **consumes** those snapshot types; it does **not** fork a second collector.

**Livelihood stance (ADR 0052 / 0080):** Silent drop of the architect's diagram is worse than honest **NotVerifiable** labeling. Parse noise from imperfect extract is preferable to pretending the topology was never submitted. Pixel-only files without structured extract are **NotVerifiable** sources — visible on the desk, not minted as invented graph nodes (R5).

**Related (not rewritten):** ADR 0037 (tenant catalog isolation), ADR 0039 (sealed immutability), ADR 0068 (dual kernel — `DraftRequests` vs `Runs`), ADR 0078 (career artifact honesty), ADR 0080 (Working seat), ADR 0082 (decision-grade provenance), ESI shipped surfaces (`RunDetailEvidenceInventorySection`), [`EVIDENCE_INTAKE_OPERATOR_GUIDE.md`](../../library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md).

## Decision

1. **Three first-class review inputs:** The authority pipeline's **decide** inputs are: **(1)** asserted text/context documents, **(2)** **structured diagrams** (parsed nodes, edges, labels, and provenance — not pixels-as-prose), and **(3)** **bound inventory snapshots** when the architecture has an `ArchitectureInventoryBinding` to an existing `AzureInventorySnapshot` (consume IE types; no second Azure collector).
2. **ESI stays inspect-only:** Opening, previewing, and downloading original bytes remains the **ESI / evidence-inventory** surface. Decide-path compilation may **reference** stored file ids and citation kinds (`diagram:` + shape id per AS-022); it does **not** replace ESI with inline-only blobs.
3. **Structured vs pixel:** Diagram files that yield a structured extract (mermaid, sanitized SVG, draw.io XML, `.vsdx` zip+xml, PlantUML/C4 text, ArchLucid diagram JSON) participate in graph compile on the decide path. **Pixel-only** attachments (PNG/JPEG without structured extract, image-only PDF pages) are **NotVerifiable** diagram sources — listed on the desk with honesty bands, **never silently dropped** and **never invented as resources** (R5).
4. **Bound inventory merge:** When a snapshot is bound, execute merges observed inventory nodes as **ObservedFact** overlay on the derived graph (AS-050). Unbound architectures show a labeled estate gap — not an empty-cloud fiction (AS-051).
5. **Vision/OCR extract:** Optional Working opt-in only — **default off** (AS-040). This ADR does **not** authorize default-on vision extract or pretend OCR succeeded when it did not.
6. **Implementation waves:** AS-002–AS-045 ship MIME contracts, parsers, graph compile, citations, and ratchets. AS-046–AS-055 ship inventory bind without rewriting the IE collector. This ADR records the durable kernel decision; parsers and MIME expansion are follow-on PRs — **not in AS-001**.

## Trade-offs

**Gains:** PR review can answer "may this diagram or inventory snapshot participate in decide?" with one ADR; architects see their Visio/draw.io/mermaid on the same footing as markdown assertions; bound inventory closes the gap between **declared** and **observed** estate without a second collector; NotVerifiable honesty prevents silent livelihood lies; ESI inspect and decide compile stay cleanly separated.

**Sacrifices:** Parser maintenance burden (vsdx zip-slip, SVG sanitization, draw.io dialect drift); graph compile may attach **label-only** nodes with confidence &lt; 1 — more desk noise than prose-only packages; bound snapshots add freshness and attach/detach authz work (AS-055); operators must learn structured vs pixel vs NotVerifiable bands; short-term increase in held/contradiction findings until engines and bindings stabilize.

**Rejected:** Silent `null` return for PNG/JPEG on intake (status quo); treating image bytes as extracted prose without structured parse; pixels-as-prose LLM hallucination of topology; a **40th coverage engine** that flags "node type missing from diagram"; merging `DraftRequests` and `Runs`; default-on vision/OCR; flipping `AgentExecution:Mode` from Simulator to Real; forking a second Azure inventory collector; SQL RLS for architecture shares (ADR 0087 is app-layer RestrictToShares inside the tenant).

## Constraints

- **Do not** rewrite Accepted ADR bodies 0067–0083 except **Related** pointers in follow-on PRs.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** flip `AgentExecution:Mode` default from **Simulator** to Real — career vs rehearsal is product chrome (ADR 0086 / AS-076+), not a host-config flip (G-REAL-06 out of scope).
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent live presence avatars or finding-comment chat.
- **Do not** add a coverage engine for "node type missing from diagram" (AS-041 forbids).
- **Do not** make vision/OCR extract **default-on** — Working opt-in only (AS-040).
- **Do not** fork a second Azure collector — consume [`INFRA_EVIDENCE_PLANE.md`](../../library/INFRA_EVIDENCE_PLANE.md) snapshot types (AS-054 ratchet).
- **Do not** replace ADR 0037 tenant catalog isolation with SQL RLS for shares (ADR 0087).
- **TB-645 vocabulary** on operator-facing diagram/inventory honesty copy. **TB-2005** on any new form surfaces.
- Terraform for net-new infra — parsers and bind tables follow existing SQL/API patterns; no net-new Azure collection resources in this wave.

## Expected impact

**System:** AS-002–AS-045 extend MIME inventory, context ingestion contract, parsers, `diagram:` citations, and CI ratchets so PNG is not silently dropped and structured diagrams compile into the review graph. AS-046–AS-055 add `ArchitectureInventoryBindings`, attach/detach API, desk controls, and ObservedFact merge. Decide path gains three input classes; ESI preview unchanged.

**Security:** Sanitized SVG/draw.io/vsdx parsing reduces XSS and zip-slip risk versus serving raw XML in the browser; fail-closed NotVerifiable labeling prevents uncited pixel topology from entering sealed manifests as invented nodes; bind/unbind authz and Required audit (AS-055) close IDOR on inventory snapshots inside the tenant; default-off vision limits exfiltration of sensitive diagram pixels to optional opt-in paths. Tenant isolation (ADR 0037) unchanged.

**Operations:** Support distinguishes NotVerifiable (pixel-only submitted) vs parse failure vs unbound estate gap; on-call runbooks cite 0084 + operator guide updates (AS-029/030); CI guards on ADR existence and PNG-not-dropped ratchets prevent regression to silent drop.

**Cost:** Engineering time for parser wave and inventory bind; runtime cost bounded by parse-on-submit and snapshot bind lookups — no second continuous Azure collection; optional vision opt-in billed only when explicitly enabled.

**Teams:** Principal architects defend diagrams and live estate on the decide path; GTM must not claim full vsdx/mermaid parity until AS prompts ship; IE plane owners consume bindings without rewriting the collector; Working seat density (ADR 0080) gains diagram-source strips (AS-044).

## Consequences

- **Positive:** Kernel ontology matches how architects actually work; 0084 becomes the merge-blocking question for diagram/inventory decide participation; wave 22 can parallel ADRs 0085/0086/0087 after 0084 lands.
- **Negative:** 0084 alone is contract-only — PNG still returns `null` until AS-004; parsers and bind tables are follow-on; short-term desk noise from NotVerifiable and label-only nodes.
- **Follow-ups:** AS-002 MIME kind inventory; AS-003 context ingestion MIME contract; AS-004 stop PNG `null`; AS-046 inventory bind contract; AS-056 ADR 0085 semantic support band; AS-076 ADR 0086 career vs rehearsal doors; AS-086 ADR 0087 RestrictToShares; AS-100 wave close audit.
