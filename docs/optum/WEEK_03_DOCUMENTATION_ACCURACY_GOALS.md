> **Reviewed:** 2026-09-15
>
> **Scope:** Week-3 delivery proposal for the Optum SecureNow engagement — documentation accuracy (diagram import vs Azure inventory). Not a commitment to ship every item in one calendar week; use as the scope boundary for the next increment and sponsor conversation.

# Week 3 — documentation accuracy goals (Optum)

**Audience:** Optum management sponsors, delivery owner, engineering agents scoping SecureNow / infra-evidence work.

**Last reviewed:** 2026-09-15

**Depends on:** Week 1 inventory snapshots and week 2 inventory-generated diagrams (see [README.md](README.md)).

---

## Headline proposal

Frame **week 3 as a documentation accuracy pass**: take Optum’s existing architecture diagrams, reconcile them against the week-1 inventory snapshot, and return **one accuracy figure plus one exportable difference report per subscription**.

That is the natural third beat after inventory and diagrams. It is what management asked for before security and compliance features. It also produces the **accurate records** prerequisite for the remediation factory and ARC-AMPE compliance factory.

---

## Where delivery stands (2026-09-15)

### Weeks 1–2 — delivered in product

| Capability | Implementation anchors |
| --- | --- |
| **Azure inventory** | Customer script (`scripts/azure/Get-SecureNowAzurePackage.ps1`, Resource Graph preferred) or hosted ARM read (`GetOnlyHostedAzureArmReadClient`); materialized to `AzureInventorySnapshots` via `AzureInventorySnapshotMaterializer`; auto-diff vs prior snapshot |
| **Diagrams from inventory** | `InfraEvidenceSnapshotMermaidService` — executive, network, identity, data, full, resource group map, dependency neighborhood; server PNG/SVG export; peel/collapse for large subscriptions |
| **SecureNow nav** | Infrastructure group: diagrams → diagram reconcile → advisory Terraform (`securenow-nav-reshape.ts`) |

### Week 3 — partially built; gaps block a credible Optum demo

The comparison engine exists (`DiagramInfrastructureMatcher`, workbench at `/governance/infrastructure/diagram-reconcile`) but four gaps matter for this engagement:

1. **Sealed architecture review required.** `DiagramInfrastructureReconciliationService` takes a `runId` and enforces `DiagramInfrastructureReconciliationSealedManifestHashGuard`. Comparing a Visio file to a snapshot today requires creating and sealing an architecture review — a workflow SecureNow skips and Optum did not ask for.

2. **Nodes only, not connectivity.** Parsed diagrams carry edges (`ArchitectureDiagramEdgeRecord`). Inventory snapshots carry typed relationships (NIC→subnet, VNet peering, private endpoints, LB/AGW backends, App Service VNet integration). The matcher never reads `diagram.Edges`. The only connectivity-adjacent check is a narrow exposure heuristic (label implies “private” vs public IP / `enablePublicNetworkAccess`).

3. **Crude label matching.** `DiagramInfrastructureLabelParser` lowercases labels, extracts resource group from parentheses, and recognizes seven type tokens (sql, storage, vnet, vm, keyvault, publicip, appservice). Real enterprise diagrams use aliases (“Member Portal — Prod”, “Payer Hub”), not `stprodmemberportal01`. No alias dictionary or human-confirmed mapping.

4. **No leave-behind artifact or headline metric.** The workbench renders a table only — no CSV/DOCX/PDF export, no documentation-accuracy percentage. Every unclaimed inventory resource becomes an `InfrastructureOnly` row, which will overwhelm a real subscription.

---

## Proposed week-3 feature goals

Ship in this order. Items 1 and 3 unblock a demo with Optum’s files; item 2 supplies the finding that sells the security phase; item 4 is the management leave-behind; item 5 makes the meeting land.

### 1. Snapshot-scoped reconcile (no architecture review required) — **P0**

**What:** New path: diagram source + `snapshotId` → correspondence rows. Operator uploads a drawing, selects last week’s snapshot, runs reconcile.

**Why:** Without this, week-3 demo cannot use their files without forcing a sealed review workflow.

**Constraint:** Keep the existing sealed-manifest guard on the run-linked path. Label the new path **advisory documentation accuracy**, not review evidence (consistent with `SECURENOW_HONESTY_COPY.md`).

**Anchors:** `DiagramInfrastructureReconciliationService`, `POST /v1/architecture/runs/{runId}/diagrams/reconcile` (extend or parallel snapshot-only route).

---

### 2. Operator-confirmed node mapping — **P0**

**What:** Let an architect assert “this diagram node = that cloud resource,” persist the mapping, reuse on the next reconcile run.

**Why:** Converts weak first-pass label matching into a 30-second human action. Persisted mappings **are** the beginning of accurate records Optum lacks.

**Anchors:** `DiagramInfrastructureMatcher`, correspondence row model (`DiagramInfrastructureCorrespondenceRow`).

---

### 3. Edge reconciliation — **P1**

**What:** Compare `diagram.Edges` to snapshot `ResourceRelationships`; add row kinds for **drawn but not present** and **present but not drawn**.

**Why:** Box lists rot slowly; connectivity rots fast. This is the difference class architecture-poor organizations are most wrong about — and the sentence that justifies the security remediation phase.

**Anchors:** `AzureInventoryRelationshipAssociationTypes`, `ArchitectureDiagramEdgeRecord`, inventory graph resolver.

---

### 4. Accuracy scorecard + export — **P1**

**What:** One headline figure per diagram+snapshot pair (matched / diagram-only / infrastructure-only / conflicts) plus CSV and document export (artifact synthesis path).

**Why:** Management needs a number and a file they can forward. Table-only UI does not survive the meeting.

**Aggregation:** Roll up `InfrastructureOnly` by resource group and type — do not emit one row per resource in large subscriptions.

**Denominator honesty:** `AzureInventoryVisibleSnapshotProjection` and `AzureInventoryNeverShowArmTypes` filter dashboards, Log Analytics workspaces, DNS zones, peering child records, etc. State the denominator explicitly so portal counts are not argued in the room.

---

### 5. Match-kind overlay on diagram canvas — **P2 (polish)**

**What:** Paint reconcile `MatchKind` on the diagram (Exact / Probable / Possible / DiagramOnly / InfrastructureOnly / Conflict / Unknown) — not table-only.

**Why:** For an audience without architecture teams, a colored diagram communicates in seconds.

**Anchors:** Scoped prompt `.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md` (DAU-08); `DiagramReconcileWorkbenchClient`, `formatDiagramReconcileExplanation`.

---

## Explicitly out of scope for week 3

| Topic | Reason |
| --- | --- |
| **Terraform state vs actual** | Only snapshot-to-snapshot inventory diff and advisory Terraform stubs exist today |
| **Apply / auto-remediation** | `SA-22` hold; verify on next snapshot only |
| **Compliance attestation** | ARC-AMPE pack #24 is architecture themes; automated evaluation ≠ auditor conclusion |
| **Vision / OCR on raster diagrams** | PNG/PDF vision-ingest is simulator-only; do not lead with uncertain extraction in a skeptical audience |
| **Lucidchart, PlantUML, legacy `.vsd`** | Not in `SupportedContextDocumentContentTypes` |

---

## Supported diagram intake (ask Optum now)

Structured import today (`SupportedContextDocumentContentTypes`):

| Format | MIME / extension |
| --- | --- |
| Mermaid | `text/vnd.mermaid` |
| Visio | `.vsdx` — `application/vnd.ms-visio.drawing.main+xml` |
| draw.io | `application/vnd.jgraph.mxfile` |
| Sanitized SVG | `application/vnd.archlucid.diagram+svg` (not raw `image/svg+xml`) |
| Native diagram JSON | `application/vnd.archlucid.diagram+json` |

**Not supported:** PowerPoint, legacy `.vsd`, raw PNG/JPEG as structured topology (stored only; not verifiable on decide path).

**Action:** Request `.vsdx` or draw.io originals before the meeting. Queue PPTX shape-and-connector parser as a follow-on increment if they cannot produce structured sources.

---

## Demo and narrative risks

### Low first-pass match rate is the finding

A low correspondence rate on real Optum diagrams **is** the outcome — it means records do not describe the estate. Do not hide it.

**Mitigation:** Run their diagrams privately before the meeting; seed alias mappings; present the number as a **documentation-accuracy baseline** to re-measure later. Demo the mapping affordance closing a gap live.

### Stale inventory

Re-pull inventory immediately before the demo. Snapshot `CapturedUtc` will be on screen.

### Transition to week 4 (remediation factory)

The reconcile workbench already supports `ingestOperationalSecurityFindings`. `FourRealityDriftEngine` consumes reconciliation results. End week-3 demo by pushing one difference row into the security queue — transition earned, not asserted.

---

## Match taxonomy (current product)

`DiagramInfrastructureMatchKinds` (`ArchLucid.Contracts/Architecture/DiagramInfrastructureMatchKinds.cs`):

| Kind | Meaning |
| --- | --- |
| `Exact` | Name, resource group, and type matched |
| `Probable` | Name and RG matched; type compatible |
| `Possible` | Name-only match |
| `DiagramOnly` | Node with no inventory match |
| `InfrastructureOnly` | Inventory resource with no diagram node |
| `Conflict` | Multiple candidates or security discrepancy (e.g. diagram implies private, inventory public) |
| `Unknown` | Unclassifiable label |

---

## Success criteria for week 3 (sponsor-visible)

- [ ] At least one Optum diagram ingested (structured format) against a current inventory snapshot **without** a sealed architecture review
- [ ] Scorecard with headline match / gap counts and explicit denominator
- [ ] Exportable difference report (CSV minimum; document export preferred)
- [ ] Live demo: one human-confirmed mapping improving a row
- [ ] Optional: one edge-level gap row (if item 3 ships)
- [ ] Optional: overlay on diagram canvas (if item 5 ships)
- [ ] Honest framing: advisory documentation accuracy, not compliance attestation or live apply

---

## Engineering backlog mapping (when picking up work)

| Goal | Suggested tracking |
| --- | --- |
| Snapshot-scoped reconcile | New infra-evidence prompt or IE-UX extension; parallel to IE-19 |
| Operator-confirmed mapping | Persistence table + matcher precedence over heuristics |
| Edge reconciliation | IE-19 extension or IE-20 family |
| Scorecard + export | IE-UX + `ArchLucid.ArtifactSynthesis` export |
| Canvas overlay | DAU-08 (`.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md`) |

No GTM rows exist for Optum or SecureNow weekly cadence as of 2026-09-15; this folder is the engagement record until a backlog row is opened.
