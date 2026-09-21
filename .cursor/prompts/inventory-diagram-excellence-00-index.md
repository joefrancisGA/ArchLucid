<!-- Inventory-diagram excellence — Composer prompts.
     Origin: 2026-09-21 owner Full subscription forest after Visio-style
     resource-group frames + hop-lift / maximize-edges. Owner asked for
     further improvement (capture, algorithms, packing, honesty) and then
     for a prompt set covering every diagram type. Do not implement from
     this index. -->

# Inventory-diagram excellence — Composer prompt set (IDX-01–IDX-13 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. Visio-style **resource-group frames** and **hidden NIC/PE hop lift** made the Full subscription canvas readable. It is still not excellent: capture drops nested ARM ids, same-RG collocation invents all-to-all chords, verbs collapse to `connects`, nested Azure boxes never draw, singleton-RG tails dominate, private endpoints have no workbench opt-in, and neighborhood / selected / data-flow canvases do not share the same honesty rules.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-excellence-NN-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_EXCELLENCE_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_EXCELLENCE_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IDR, IDA, IDF, IDP, IE-ND, IE-ID, IE-DD, IE-RF, AX-DE, AX-DC, SN-DF, SN-PE, SN-RT** as greenfield inside an IDX session. Extend the existing collector family, `DiagramAstFromGraphCompiler`, inventory-forest, Export Mermaid, and Graphviz PNG. Nested VNet/subnet and subscription frames are **authorized here** as **IDX-05 / IDX-06**. They stay forbidden from **IDA / IDF** chats.

## Locked diagnosis (do not re-diagnose)

Owner snapshot `Hmd_HL_HAP_Non_Prod` (captured 2026-09-19): **424** inventory resources, Full subscription canvas **~247** visible nodes. Live engine: **inventory-forest**. After RG-first packing and hop lift, humans can read groups, but:

1. **Capture still drops the ids that would draw edges.** NIC `ipConfigurations[].subnet.id`, PE subnet/target, Standard Logic App `$connections.value`, App Service `kind`, ADF linked-service ARM ids, and diagnostic workspace ids are often empty on hosted `/resources` list rows. Algorithms cannot invent those hops.
2. **Compose happens too late and too narrowly.** `DiagramCollapsedAttachmentEdgeLifter` runs after mode filters. DataFlow / DataArchitecture skip it. Graph-build still stores VM→NIC and PE→NIC instead of a shared visible projection used by every `DiagramMode`.
3. **Same-RG collocation and single-VNet placement create all-to-all.** A Logic App with five `Microsoft.Web/connections` in the same group becomes a clique. Cross-RG isolates stay isolates unless a cited hop exists. That is honest only as a last resort, and the label must stay `likely · in`.
4. **Verbs are flattened.** `CONTAINS`, `PEERS_WITH`, `APPLIES_TO`, `CAN_READ` often render as `connects` or `likely · in`. Humans cannot tell peering from placement from identity.
5. **Nested Azure boxes were IDA-HOLD / IDF-HOLD.** Network mode already wanted subnet subgraphs (**IE-ND-04**). Identity/Data canvases still need the same packer when those node types survive the mode filter — skip empty nest, do not invent VNets.
6. **Layout leftovers.** Role-blind grids inside an RG; a long tail of singleton-RG frames; duplicate Office365 connection cards; no PE toggle even though `IncludePrivateEndpointNodes` exists; completeness is a generic banner; neighborhood still feels like a cropped subscription.

**Signature (fail this wave if still true after IDX-01–13):** Full subscription walkthrough still reports near-1:1 nodes-to-components with a handful of edges while NIC/PE/Logic App files exist; any mode draws a complete graph inside an RG without cited hops; PE cards appear without the opt-in; Identity/DataFlow ignore the shared hop composer; nested VNet/subnet frames exist only in Network mermaid.

## All `DiagramMode` contract (every prompt)

Every IDX prompt applies to **all** values of `ArchLucid.ArtifactSynthesis.Models.DiagramMode`. If a change is graph-build or collection, it automatically feeds every mode. If a change is layout/UI, compile **each** mode (or a fixture per mode) and skip only when the mode’s node filter leaves nothing to draw.

| `DiagramMode` | Workbench key | Node filter today | Shared rule for this wave |
|---------------|---------------|-------------------|---------------------------|
| `Executive` | `executive` | Always-show peel + VNets; NICs hidden; PE hidden unless opt-in | Subscription outer + RG frames; nest VNets that remain; verbs on peering; completeness on peeled-away classes |
| `Architecture` | add parser key `architecture` if missing | Compute + network + storage | Same hop composer / verbs / nested frames for surviving nodes |
| `Network` | `network` | `Microsoft.Network/*` + attached VMs | Hero for nested VNet→subnet; PE still hidden default; do not show NIC cards |
| `Security` | add parser key `security` if missing | Security nodes; NICs hidden | `applies` / `protects`; **no** Full-subscription-scale RBAC clique |
| `Identity` | `identity` | Identity category | Shared composer; skip VNet nest when no network nodes; federated/member verbs |
| `Data` | `data` | Data + storage | PE hops still place accounts `in` VNets; no stage swimlanes |
| `DataFlow` | `dataFlow` | Movement stages (ADF / apps) | **Keep stage subgraphs.** Also apply cited hops, verbs, PE opt-in, completeness. Do **not** replace stages with RG-first packing. Nest VNet only when a stage node is ARM-located in one |
| `DataArchitecture` | `dataArchitecture` | Repository type groups | Keep type-group subgraphs. Same hop/verb/completeness rules. No RG-first replacement |
| `FullSubscription` | `full` | Almost all topology; NeverShow NIC/PE | Hero for singleton-RG collapse, completeness strip, Visio RG frames already in play |
| `ResourceGroup` | `resourceGroup:{name}` | One RG | Nested VNet/subnet inside that RG; **no** subscription outer; **no** collapse of *other* RGs |
| `SelectedResources` | add parser key if missing | Explicit node ids | Cited hops among the selection + attachments needed to explain them; no whole-sub packing |
| `DependencyNeighborhood` | `dependencyNeighborhood` | BFS from seed, default depth 2 | Hop-focus: include hidden NIC/PE *analysis* but not cards; do not paint the rest of the subscription |

**Surfaces in scope for every mode:** live **inventory-forest** SVG, **Export Mermaid**, **Graphviz PNG**. When DataFlow/DataArchitecture use different subgraph planners, still keep label verbs, PE toggle, completeness, and hop compose.

**Parse gaps:** `InfraEvidenceMermaidModeParser` today documents `executive, network, identity, data, dataFlow, dataArchitecture, full, resourceGroup, dependencyNeighborhood`. IDX-10 / IDX-12 may add `architecture`, `security`, and `selectedResources` keys so those enum values are reachable from the workbench. Do not drop existing keys.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Capture** | Empty nested ARM ids on hosted list rows | Persist NIC/PE/subnet/Logic App/app-settings/ADF/diagnostics relationship properties | IDX-01 |
| **Compose** | Mode-local lift after filters | Snapshot visible-projection compose + `(from,to,role)` dedupe before every mode | IDX-02 |
| **Honesty** | Same-RG all-to-all / single-VNet fan-out | Cited hop or explicit `likely · in` last resort; no cross-RG without a hop | IDX-03 |
| **Verbs** | Generic `connects` | `in` / `contains` / `peering` / `uses` / `reads` / `applies` / `may access` | IDX-04 |
| **Nest** | RG frames only | VNet → subnet frames when those nodes exist | IDX-05 |
| **Subscription** | No outer box | Subscription frame on subscription-scoped modes | IDX-06 |
| **Pack** | Role-blind grid inside RG | Role columns + hub placement | IDX-07 |
| **Tail** | One frame per singleton RG | Collapsed “other resource groups” with expand | IDX-08 |
| **Dupes** | One card per `Microsoft.Web/connections` | Collapse same-API connections; keep cited hops | IDX-09 |
| **PE UI** | Compile flag, no control | Opt-in toggle on every inventory diagram workbench, default off | IDX-10 |
| **Completeness** | Generic banner | Mode-aware strip: collected vs missing relationship classes | IDX-11 |
| **Focus** | Neighborhood feels like a crop | Hop-focus compile for neighborhood / selected / RG | IDX-12 |
| **Ratchet** | Full-sub-only tests | All 12 modes × forest / Mermaid / PNG | IDX-13 |

## What this set does *not* change

Keep: inventory-forest as the live canvas. Visio RG-first packing (including singleton named frames) if already on trunk. `IncludePrivateEndpointNodes` default **false**. IDA palette/cards/elbows/legend. IDP declared dash `4 3`. IDF 2 px solid RG stroke. Export Mermaid topology. One Azure collector family.

Do **not** draw a complete graph to “maximize edges.” Do **not** show NIC or PE cards unless the PE toggle is on (NICs stay hidden even then unless a later owner prompt says otherwise). Do **not** ship Microsoft Azure product icons. Do **not** dump RBAC `HAS_ROLE` / `MAY_ACCESS` onto Full subscription. Do **not** retune Mermaid `nodeSpacing`. Do **not** default Graphviz `dot`. Do **not** merge disconnected components solely so one RG is a single island.

## Run order

**01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13.**

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDX-01** Recapture relationship properties | First | Existing extractor family (do not re-run AX-DE as greenfield) |
| **IDX-02** Graph-build hop compose + dedupe | After 01 preferred; can start on fixtures | Shared visible projection |
| **IDX-03** Cited hops, no all-to-all | After 02 | Composer exists so collocation can be demoted |
| **IDX-04** Honest verbs | After 02 (prefer 03) | Edge types stable |
| **IDX-05** Nested VNet → subnet frames | After 04 preferred | Verbs exist; Network still works if 04 slips |
| **IDX-06** Subscription outer frame | After 05 | Nested packer exists so outer is one more layer |
| **IDX-07** Role-aware packing + hubs | After 05 | Inner frames exist |
| **IDX-08** Singleton-RG collapse | After 06 | Subscription + RG frames exist |
| **IDX-09** Duplicate connection collapse | After 03 | Cited hops so collapse does not drop the only edge |
| **IDX-10** PE opt-in toggle | After 02 | Compose already uses hidden PEs |
| **IDX-11** Completeness strip | After 01 | Capture codes exist |
| **IDX-12** Hop-focus neighborhood / selected / RG | After 02+03 | Shared composer |
| **IDX-13** Cross-mode parity ratchet | Last | 01–12 merged (or land failing tests for merged slices) |
| **IDX-HOLD** | Not implementation | — |

**IDX-01 before celebrating edge counts.** More algorithms on empty properties still yield 15 edges.

**IDX-HOLD** is not implementation. Paste `inventory-diagram-excellence-14-hold.md` only if a session starts a complete graph, default NIC/PE cards, Microsoft icons, Full-subscription RBAC, ARM `dependsOn`, a second collector, or nested frames from an **IDA / IDF** chat.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-excellence-<short-name>-idx1`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-excellence-prompts-2f4b`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-excellence-01-recapture.md` | Nested ARM relationship properties never land in the snapshot |
| 02 | `inventory-diagram-excellence-02-graph-build-compose.md` | Hop lift is compile-local and skips DataFlow / some modes |
| 03 | `inventory-diagram-excellence-03-cited-hops.md` | Same-RG / single-VNet all-to-all and cross-RG guesses |
| 04 | `inventory-diagram-excellence-04-honest-verbs.md` | Every remaining edge reads as `connects` |
| 05 | `inventory-diagram-excellence-05-nested-vnet-subnet-frames.md` | No VNet/subnet boxes; IDA-HOLD/IDF-HOLD blocked this |
| 06 | `inventory-diagram-excellence-06-subscription-outer-frame.md` | No subscription container on subscription-scoped views |
| 07 | `inventory-diagram-excellence-07-role-aware-packing.md` | Role-blind grids; hubs lost in columns |
| 08 | `inventory-diagram-excellence-08-singleton-rg-collapse.md` | Long tail of one-node RG frames |
| 09 | `inventory-diagram-excellence-09-duplicate-connection-collapse.md` | Duplicate Logic App connector cards |
| 10 | `inventory-diagram-excellence-10-pe-opt-in-toggle.md` | PE cards have no workbench opt-in; hops already used |
| 11 | `inventory-diagram-excellence-11-completeness-strip.md` | Generic banner; walkthrough counts unexplained |
| 12 | `inventory-diagram-excellence-12-hop-focus-modes.md` | Neighborhood / selected / RG still feel like a crop of Full |
| 13 | `inventory-diagram-excellence-13-cross-mode-ratchet.md` | Next agent Full-sub-only tests the rest of the enum |
| HOLD | `inventory-diagram-excellence-14-hold.md` | Complete-graph / default PE / icons / RBAC dump |

## Prerequisites (do not re-implement)

If trunk is missing Visio-style RG-first packing (`DiagramResourceGroupPacker` named singleton frames, RG-first canvas) or hop-lift hydrators (`DiagramCollapsedAttachmentEdgeLifter`, parent-child, subnet ancestor mapping, Logic App / property ARM-id hydrators), **stop** and say so. Cherry-pick or wait. IDX chats do not rebuild those features.

## After each prompt

Summarize: files changed, tests run, **which of the 12 `DiagramMode` values were compiled**, whether PE cards remained hidden by default, residual risk (hosted recapture needs a new snapshot; PNG vs forest).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` **or** skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No Azure HTTP at diagram compile time.
