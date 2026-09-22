> **Scope:** Contributor-reference — wave 22 (AS-001–AS-100) close-audit evidence for diagrams and bound inventory on the review decide path, semantic support career band, Career vs Rehearsal doors, and optional RestrictToShares. Not buyer-facing copy.

# Architecture-spine wave close audit (AS-100)

> **Date:** 2026-09-09 (wave 22 — AS-001–AS-100)  
> **Owner decision:** Diagrams and bound inventory are **review decide inputs** (ADR **0084**); semantic support is a Working **career band** not a sync commit gate (ADR **0085**); Working **Career vs Rehearsal** doors without flipping host `AgentExecution:Mode` (ADR **0086**); optional **RestrictToShares** inside the tenant (ADR **0087**).  
> **Spine:** [ADR 0084](adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md) · [ADR 0085](adrs/0085-semantic-support-band-working-career-not-commit-gate.md) · [ADR 0086](adrs/0086-career-vs-rehearsal-doors-no-host-mode-flip.md) · [ADR 0087](adrs/0087-architecture-scoped-sharing-restrict-to-shares.md) · [`.cursor/prompts/architecture-spine-00-index.md`](../../.cursor/prompts/architecture-spine-00-index.md) · [ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md](ARCHITECTURE_SPINE_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** on this branch for Working production seats, subject to the residuals below. The authority pipeline accepts structured diagrams and optional inventory bind; pixel-only sources are **NotVerifiable** (not silent drops); Working shows semantic support bands; Career vs Rehearsal chrome blocks unlabeled Ready-to-finalize on Rehearsal; RestrictToShares is opt-in with IDOR enforcement; host `AgentExecution:Mode` default remains Simulator; bind wave did not fork a second Azure collector.

This audit does **not** claim the IE collector plane shipped, G-REAL-06 Real-mode default, CPA SOC 2, or third-party pen test.

## Merge gates (owner checklist)

| # | Gate | Shipped? | Evidence |
|---|------|----------|----------|
| 1 | ADR **0084** exists with Trade-offs / Constraints / Expected impact | **Yes** | [`0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md`](adrs/0084-architecture-review-inputs-include-diagrams-and-bound-inventory.md); ADR index row in [`adrs/README.md`](adrs/README.md) |
| 2 | PNG/JPEG are **not silently dropped** from intake | **Yes** | `intake-pixel-diagram-context-document.test.ts` (AS-004); `intake-pixel-diagram-context-document.ts` emits `application/vnd.archlucid.diagram+json` stub instead of `null` |
| 3 | At least one structured parser compiles into the review graph | **Yes** | `MermaidContextDocumentParserTests.cs` (AS-007); `VsdxContextDocumentParserTests.cs` (AS-010); `StructuredDiagramGraphCompiler` path in `ArchLucidDiagramJsonContextDocumentParserTests.cs` (AS-017) |
| 4 | Pixel-only attachments are **NotVerifiable**, not invented topology | **Yes** | `read-pixel-diagram-not-verifiable-sources.test.ts` (AS-005); `architecture-spine-r5-diagram-never-mints-resources-matrix.test.ts` (AS-045); `PixelDiagramIntakeStubDetector.cs` |
| 5 | Support band enum + Working chip + mismatch test | **Yes** | `FindingSemanticSupportBand` wire (AS-059); `decision-grade-semantic-support-band-guard.test.ts` (AS-072); `ArchitectureSpineAs073HeuristicMismatchArchitectureTests` (AS-073) |
| 6 | Career/Rehearsal chooser; Simulator cannot show unlabeled **Ready to finalize** | **Yes** | `WorkingCareerRehearsalChooser.tsx` (AS-077); `RunProgressTracker.test.tsx` suppresses Ready on Rehearsal (AS-079); `architecture-spine-as084-career-rehearsal-chrome-matrix.test.ts` |
| 7 | **RestrictToShares** opt-in + IDOR | **Yes** | `ArchitecturesControllerRestrictToSharesTests.cs` (AS-089); `RestrictedArchitectureShareIdorIntegrationTests.cs` + `ArchitecturesControllerRestrictedShareIdorTests.cs` (AS-091) |
| 8 | No host **`AgentExecution:Mode`** default flip | **Yes** | `ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests.cs`; ADR 0086 |
| 9 | No second Azure collector in bind wave | **Yes** | `ArchitectureSpineAs054ForbiddenCollectorArchitectureTests.cs`; [`ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md`](../library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md) |

## Cluster evidence

| Cluster | Prompts | Shipped? | Primary evidence | Residual |
|---------|---------|----------|------------------|----------|
| Kernel ADR | AS-001, 056, 076, 086 | Yes | ADRs 0084–0087; `ArchitectureSpineAs056/076/086` ratchets | None |
| Diagram MIME + intake | AS-002–AS-005, 014–015 | Yes | `architecture-input-kind-inventory.ts`; pixel stub + NotVerifiable warnings | Vision/OCR extract default-off (AS-040) — opt-in only |
| Structured parsers + graph | AS-006–AS-023 | Yes | Context-ingestion parser tests; `ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md` | draw.io / PlantUML parity varies by fixture maturity |
| Desk + citations + help | AS-024–AS-030 | Yes | Diagram source strip; help topics; inspect jump tests | Full shape highlight on every format not required for close |
| Diagram ratchets + golden | AS-031–AS-045 | Yes | R5 matrix Vitest; C# mermaid/vsdx fixtures | New binary extensions need honesty row (AS-038) on each add |
| Inventory bind | AS-046–AS-055 | Yes | SQL migration 378/380; attach API; `ArchitectureSpineAs054` | IE plane collection still separate — bind **consumes** snapshots |
| Semantic support band | AS-056–AS-075 | Yes | ADR 0085; overlay persist; desk chip; export JSON band; LLM judge default off (AS-074) | PilotStrict hold on Unsupported optional (AS-065) |
| Career vs Rehearsal | AS-076–AS-085 | Yes | Chooser + help; CLI `--rehearse`; host Mode ratchet | G-REAL-06 remains owner/GTM |
| Architecture shares | AS-086–AS-099 | Yes | SQL shares; UI panel; IDOR; OpenAPI invariants; help boundary | SCIM groups not share targets (AS-096); no chat/presence |
| Close | AS-100 | Yes | This file; `architecture-spine-prompt-inventory.test.ts` | See residuals below |

## Prompt inventory

All **100** paste-ready files under `.cursor/prompts/architecture-spine-*.md` plus `architecture-spine-00-index.md` are present. Vitest ratchet: `archlucid-ui/src/lib/architecture-spine-prompt-inventory.test.ts`.

## Residuals (out of wave)

| Item | Tracking | Notes |
|------|----------|-------|
| Concurrent desk / work lease without presence | Livelihood UX wave 23 **LW-001–LW-100** | [`LOST_WRITE_COMPOSER_PROMPTS.md`](LOST_WRITE_COMPOSER_PROMPTS.md) — ADR **0090** + mandatory draft CAS (**0088**); not live presence |
| Intake wizard + architecture-rename dirty-form guards | LP-11 deferred | Livelihood document guards partial |
| Stop-analysis confirm | FP leftover | Not a disposition write |
| Findings-queue list DTO row versions (N+1) | FP residual | Pointer CAS follow-on |
| Bulk list DTO row versions | FP residual | Same family as queue N+1 |
| `MUTATION_UNDO_WINDOW_SECONDS = 300` | unchanged | Owner decision — not lengthened |
| IE-01–IE-22 collector / snapshot implementation | IE plane | AS-046+ **binds**; does not ship collection |
| G-REAL-06 Real-mode default host config | GTM | Do not flip `AgentExecution:Mode` |
| Vision/OCR extract default-on | AS-040 hold | Working opt-in only |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | TB-135/TB-136 tech Done; GTM owner work open |
| GTM cohorts M-90 / M-44 / M-91 / M-92 | GTM V1.1 | Not assessment engineering batches |
| Live presence / finding-comment chat | out of product | ADR 0087 / 0037 |

## Do not claim

- Infrastructure-evidence **collector plane** shipped (IE-01–IE-22 bodies).
- **G-REAL-06** executed or host default moved to Real.
- **Second tenant** or SQL RLS from architecture shares (help + ratchets AS-097/098).
- CPA SOC 2 attestation or published third-party pen test.

## Verification commands (focused)

```bash
cd archlucid-ui
npx vitest run src/lib/architecture-spine-prompt-inventory.test.ts
npx vitest run \
  src/lib/architecture-spine/intake-pixel-diagram-context-document.test.ts \
  src/lib/architecture-spine/architecture-spine-r5-diagram-never-mints-resources-matrix.test.ts \
  src/lib/architecture-spine/architecture-spine-as084-career-rehearsal-chrome-matrix.test.ts \
  src/lib/architecture-spine/architecture-share-api-contract.test.ts
```

```bash
dotnet test ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj \
  --filter 'FullyQualifiedName~ArchitectureSpineAs0'
```

```bash
dotnet test ArchLucid.ContextIngestion.Tests/ArchLucid.ContextIngestion.Tests.csproj \
  --filter 'FullyQualifiedName~MermaidContextDocumentParserTests|FullyQualifiedName~VsdxContextDocumentParserTests'
```

```bash
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
  --filter 'FullyQualifiedName~RestrictedArchitectureShareIdor|FullyQualifiedName~ArchitecturesControllerSharesTests'
```

## Related

- [`ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md`](../library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md)
- [`ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md`](../library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md)
- [`ARCHITECTURE_SHARE_ACL_CONTRACT.md`](../library/ARCHITECTURE_SHARE_ACL_CONTRACT.md)
- [`FINDING_POINTER_CAS_ACCEPTANCE_2026-09-08.md`](FINDING_POINTER_CAS_ACCEPTANCE_2026-09-08.md) — predecessor wave 21
