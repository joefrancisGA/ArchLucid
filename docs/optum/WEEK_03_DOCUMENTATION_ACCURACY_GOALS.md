> **Reviewed:** 2026-09-15
>
> **Scope:** Week-3 delivery proposal for the Optum SecureNow engagement — documentation accuracy (diagram import vs Azure inventory). Not a commitment to ship every item in one calendar week; use as the scope boundary for the next increment and sponsor conversation.

# Week 3 — documentation accuracy goals (Optum)

**Audience:** Optum management sponsors, delivery owner, engineering agents scoping SecureNow / infra-evidence work.

**Last reviewed:** 2026-09-15

**Depends on:** Week 1 inventory snapshots and week 2 inventory-generated diagrams (see [README.md](README.md)).

**Paths:** Primary — diagram import vs inventory (below). **Fallback** — [estate truth baseline](#fallback-week-3--estate-truth-baseline-if-diagram-import-is-blocked) when diagram format, access, or ownership cannot be agreed this week.

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

**Primary path (diagram import agreed):**

- [ ] At least one Optum diagram ingested (structured format) against a current inventory snapshot **without** a sealed architecture review
- [ ] Scorecard with headline match / gap counts and explicit denominator
- [ ] Exportable difference report (CSV minimum; document export preferred)
- [ ] Live demo: one human-confirmed mapping improving a row
- [ ] Optional: one edge-level gap row (if item 3 ships)
- [ ] Optional: overlay on diagram canvas (if item 5 ships)
- [ ] Honest framing: advisory documentation accuracy, not compliance attestation or live apply

**Fallback path (diagram import blocked):** see [success criteria under fallback](#fallback-success-criteria-sponsor-visible).

---

## Fallback: week 3 — estate truth baseline (if diagram import is blocked)

Use when Optum cannot agree on diagram source files, format, or access this week. **Do not** skip straight to the remediation factory or ARC-AMPE compliance factory — management still expects **records accuracy before security conclusions**. Pivot the definition of accuracy from **their drawings vs reality** to **reality vs itself over time**, plus **gaps in what Azure already knows**.

### Reframe for management

> We cannot reconcile against your Visio or PowerPoint until we agree on source files and access. This week we will (1) pin an inventory baseline, (2) show what changed since capture, and (3) produce an **undocumented / unattributed resource report** from live inventory — the same gap class diagram reconcile would find, without needing your files yet.

Inventory-generated PNG diagrams from week 2 remain the **interim as-maintained record** until their files arrive.

### Fallback work priority

Ship in this order.

#### 1. Inventory baseline + drift report with export — **P0 (best fallback)**

| | |
| --- | --- |
| **Why** | Fully built today. No customer diagram agreement. Directly supports “we don’t have good architecture records.” |
| **Deliverables** | Pin baseline snapshot per subscription (`AzureInventoryBaselines`); second capture; drift workbench walkthrough; exportable drift report (narrative + change rows) |
| **Surfaces** | `/governance/infrastructure/drift`, `InfraEvidenceDiffsController`, `AzureInventoryDiffNarrativeService` |
| **Sponsor line** | “Here is what changed in Azure since we started — without anyone updating a diagram.” |
| **Engineering focus** | Export polish; subscription-level summary counts; classification filters (security-relevant / potentially dangerous); human-readable subscription names on reports |

#### 2. Documentation gap report from inventory only — **P0**

| | |
| --- | --- |
| **Why** | Same underlying problem (records don’t describe the estate) when import is blocked. |
| **Deliverables** | Resources missing owner / application / cost-center tags; orphan or unattached resources; public exposure and logging regression rows from `AzureInventoryDriftClassifier` |
| **Sponsor line** | “These N resources exist in Azure but are not attributable in your metadata — the documentation debt diagram reconcile would quantify once we have files.” |
| **Engineering focus** | Aggregated export by resource group and type (not one row per resource); headline counts |

#### 3. Harden week 2 for their subscriptions — **P1**

| | |
| --- | --- |
| **Why** | Weeks 1–2 are what management challenged; make them undeniable before new concepts. |
| **Deliverables** | Correct diagram modes for subscription size; PNG packs per subscription or RG; coverage statement (subscriptions captured, resource counts, `CapturedUtc`, `AzureInventoryNeverShowArmTypes` exclusions) |
| **Surfaces** | `/infrastructure/diagrams`, `InfraEvidenceSnapshotMermaidService` |
| **Sponsor line** | “This is the authoritative diagram from Azure — your files are the next layer we compare to this.” |
| **Engineering focus** | Diagram workbench UX; export bundling; freshness / re-pull before readouts |

#### 4. Security findings from inventory alone — **P2 (careful framing)**

| | |
| --- | --- |
| **Why** | Starts remediation factory without diagram import — but looks like skipping “records first” if led with this. |
| **Deliverables** | Defender summaries, public endpoints, privilege paths from SecureNow engines; demo one row ingested to remediation queue |
| **Surfaces** | Remediation factory, `FourRealityDriftEngine` (diagram reconciliation optional) |
| **Sponsor line** | “Configuration-path findings from observed inventory — advisory, verify on next snapshot, not compliance attestation.” |
| **Constraint** | Do **not** lead the week-3 readout with this if diagram import was the stated blocker. |

#### 5. Operationalize week 1 — **parallel, not a substitute**

| | |
| --- | --- |
| **Why** | Strengthens foundation while diagram-format politics resolve. |
| **Deliverables** | Hosted auto-pull on schedule (`AzureExtractorAutoPullHostedService`); multi-subscription coverage view; second snapshot cadence so drift is real next week |
| **Surfaces** | Extract & upload, tenant hosted extractor configuration |

### Fallback: explicitly out of scope this week

| Avoid | Reason |
| --- | --- |
| ARC-AMPE compliance conclusions | Needs credible estate baseline; premature without records story |
| Vision / OCR on PNG or PPT | High risk with skeptics; extraction becomes the debate |
| Large diagram-matcher work without sample files | Cannot validate against Optum naming |
| Terraform apply or “fix Azure” narrative | `SA-22` hold; honesty constraints |

### Unblock diagram import in parallel (non-engineering)

While building fallback items 1–2, seek a **minimum intake agreement**:

1. **One** subscription, **one** diagram, **one** format — `.vsdx` or draw.io preferred
2. Named owner who can export **source** (not PDF or PPT screenshots)
3. Written OK that results are **advisory documentation accuracy**, not audit evidence

If they will not agree even to that, week 3 is **baseline + drift + documentation gap report** only.

### Fallback headline (sponsor-visible)

**“Estate truth baseline”** — three numbers and one export:

1. Resources inventoried (denominator and exclusions stated explicitly)
2. Changes since baseline (drift)
3. Unattributed / undocumented resources (metadata gaps)

Plus: inventory-generated PNG diagrams as interim as-maintained record.

### Fallback success criteria (sponsor-visible)

- [ ] Baseline snapshot pinned per in-scope subscription
- [ ] Second capture completed; drift diff persisted and reviewable in drift workbench
- [ ] Exportable drift report (change rows + narrative)
- [ ] Documentation gap summary with headline counts (tags, orphans, exposure regressions) aggregated by RG/type
- [ ] Coverage statement: subscriptions, resource counts, `CapturedUtc`, known exclusions
- [ ] Inventory-generated PNG pack delivered for at least one subscription
- [ ] Honest framing: estate truth and metadata gaps — not diagram accuracy score until files arrive

### When diagram import reopens

Resume the [primary week-3 goals](#proposed-week-3-feature-goals) in order: snapshot-scoped reconcile, then operator-confirmed mappings. Baseline and drift work from the fallback week becomes the **reality** side of the comparison instead of starting cold.

---

## Engineering backlog mapping (when picking up work)

| Goal | Suggested tracking |
| --- | --- |
| Snapshot-scoped reconcile | New infra-evidence prompt or IE-UX extension; parallel to IE-19 |
| Operator-confirmed mapping | Persistence table + matcher precedence over heuristics |
| Edge reconciliation | IE-19 extension or IE-20 family |
| Scorecard + export | IE-UX + `ArchLucid.ArtifactSynthesis` export |
| Canvas overlay | DAU-08 (`.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md`) |
| **Fallback:** drift report export | Drift workbench + `InfraEvidenceDiffsController` / narrative export |
| **Fallback:** documentation gap report | Inventory metadata + orphan classifiers; aggregated export |
| **Fallback:** diagram PNG packs | `InfraEvidenceSnapshotMermaidService` export bundling |
| **Fallback:** hosted auto-pull | `AzureExtractorAutoPullHostedService` + tenant WIF config |

No GTM rows exist for Optum or SecureNow weekly cadence as of 2026-09-15; this folder is the engagement record until a backlog row is opened.
