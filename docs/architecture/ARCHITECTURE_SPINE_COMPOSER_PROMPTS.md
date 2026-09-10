> **Scope:** Copy-paste Composer prompts that put **diagrams and bound inventory on the review decide path**, add a **semantic support career band**, make **Career vs Rehearsal** explicit on Working, and add **optional architecture-scoped sharing**. Internal engineering only — not buyer-facing copy.
> **Spine:** [`START_HERE.md`](../START_HERE.md) · **Founding contract:** [`ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`](../ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md) R4 / R13 · **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/architecture-spine-00-index.md`](../../.cursor/prompts/architecture-spine-00-index.md) (**AS-001–AS-100**)
> **Predecessor (wave 21 — finding-pointer CAS):** [`FINDING_POINTER_CAS_COMPOSER_PROMPTS.md`](FINDING_POINTER_CAS_COMPOSER_PROMPTS.md) (**FP-01–FP-24**). **Do not re-run FP.**

# Architecture-spine Composer prompts (AS-001–AS-100)

**Created:** 2026-09-09 · **Status:** ready to run · **Do not re-run** LP, FP, ESI, IE collector bodies, WS, SY, AO, or DX except as an AS row names a leftover.

ArchLucid is a working-architect tool: people will sit in it much of the day, and their livelihoods may depend on the sealed record. Waves through **21** made Working an instrument (chrome, persist gates, disposition CAS). They did not change what **decide** can see.

Paste **one** `.cursor/prompts/architecture-spine-NNN-*.md` file per Composer session. Do not implement from this document’s tables.

## The problem these prompts solve

Four first livelihood-ontology failures (2026-09-09 diagnosis):

1. **The analysis kernel is still a document.** `toIntakeContextDocument` returns `null` for PNG/JPEG. Authority context is `text/plain` and `text/markdown`. ESI can open the drawing; engines never see it. Help still prefers PNG export over `.vsdx`.
2. **The seal is structurally cited, not semantically banded.** ADR 0082 fail-closes empty refs. TB-1228 keeps semantic faithfulness off the default commit path. An architect can still take a cited falsehood to ARB with no Working-visible band.
3. **The default day is still rehearsal.** Host `AgentExecution:Mode` stays Simulator (G-REAL-06 is owner). Working can still look like unlabeled career work. This wave adds **Career vs Rehearsal doors**, not a host-config flip.
4. **Permission is the workspace, not the architecture.** ADR 0074 deferred per-architecture ACL. Consultancies and ARB+delivery in one tenant cannot isolate a package. This wave adds **optional RestrictToShares** (ADR 0087) inside the tenant.

Problem 5 (concurrent desk without presence) is **out of wave** — named for wave 23 (work lease). Do not add live occupancy or finding-comment chat here.

### Done test

After this wave:

1. A mermaid or `.vsdx` attachment compiles into the review graph with `diagram:` citations. A PNG is stored and **NotVerifiable**, never silently dropped.
2. Unlabeled boxes and pixel-only files do not mint CanonicalObject resources (R5).
3. An architecture may bind an existing inventory snapshot; unbound is a labeled estate gap; no second Azure collector.
4. Working decision-grade rows show a support band; quote-mismatch with a real citation is **Unsupported**, not deleted, and not fused into insight-density.
5. Working chrome has Career / Rehearsal; Simulator cannot screenshot Ready-to-finalize; `AgentExecution:Mode` default remains Simulator.
6. RestrictToShares opt-in hides a package from unshared workspace members (IDOR tests); existing architectures stay visible.

## Diagnosis → prompt

| Class | Prompts | Residual after ESI / LP / FP / IE contract |
|-------|---------|--------------------------------------------|
| Kernel ADR | **AS-001** | Inspect ≠ decide |
| MIME map + contract | **AS-002–AS-003** | Authority allowlist still text-only |
| Stop silent drop | **AS-004–AS-005**, **AS-014–AS-015**, **AS-039** | PNG `return null`; scanned PDF = empty brief |
| Structured parse | **AS-006–AS-013** | No vsdx/draw.io/mermaid on decide |
| Decide merge | **AS-016–AS-023** | Parsers without graph compile |
| Desk + honesty | **AS-024–AS-038**, **AS-044–AS-045** | Citations not jumpable; help teaches PNG |
| Vision gated | **AS-040** | Need opt-in; default off |
| No coverage nags | **AS-041–AS-042** | Density pressure to nag missing icons |
| Bind IaC | **AS-043** | Duplicate SQL boxes vs `.tf` |
| Inventory bind | **AS-046–AS-055** | IE plane unused on the architecture locator |
| Semantic band | **AS-056–AS-075** | TB-1228 Lane B invisible on the desk |
| Career doors | **AS-076–AS-085** | Simulator as unlabeled work |
| Shares | **AS-086–AS-099** | Workspace ACL only |
| Close | **AS-100** | Next wizard drop |

## Sequencing

See [`.cursor/prompts/architecture-spine-00-index.md`](../../.cursor/prompts/architecture-spine-00-index.md). **ADRs (001 / 056 / 076 / 086) can start in parallel.** Diagram parsers after **006**. Inventory bind after **046**. Semantic after **056**. Shares after **086**. **100** last.

**001** must not implement parsers. **004** must not OCR. **016** must not overlay agent `ProposedChanges` (TB-2221). **057** must not call Azure OpenAI. **076** must not flip host Mode. **086** must not add SQL RLS.

## Owner authorizations that prior waves forbade

Prior waves said “do not invent per-architecture ACL” and “do not flip Simulator default.” This wave **narrowly authorizes**:

| Prior forbid | This wave |
|--------------|-----------|
| Per-architecture ACL | **Optional RestrictToShares** (0087), grandfather open, users not SCIM groups |
| Flip `AgentExecution:Mode` | **Still forbidden.** Career/Rehearsal is UI + execute labeling (0086) |
| IE vision default-on | **Still forbidden.** AS-040 opt-in default off |
| Merge `DraftRequests`/`Runs` | **Still forbidden** |
| Live presence / finding chat | **Still forbidden** |

## Intentional — do not “fix”

- Desktop review **workspace tabs** stay a full strip (no **More** menu).
- 300-second silent Undo toast stays 300s.
- Sealed records stay immutable.
- Context ingestion still must not accept **image bytes** as `text/plain`.
- `IArtifactBlobStore` stays the ESI string/base64 store unless a prompt says otherwise.
- Guided / demo / trial keep eval teaching (ADR 0080).
- Operational security findings stay a **third stream** (IE plane) — do not merge into `FindingsSnapshot`.

## Do not re-run

- **FP-01–24** — CAS token
- **LP-01–20** — persist gates (call honesty helpers only)
- **ESI-01–08** — inspect/preview
- **IE-01–IE-22** — collector / snapshot / Mermaid-from-inventory (consume types)
- **DX-01–DX-68** — engines (AS-053 only loads prior graph for DX-64)
- **WS-01–24 / SY / AO** — desk chrome / locator

## Related

- [`INFRA_EVIDENCE_PLANE.md`](../library/INFRA_EVIDENCE_PLANE.md)
- [`FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md`](../library/FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md)
- [`HOLD_NO_COVERAGE_ENGINES.md`](../quality/HOLD_NO_COVERAGE_ENGINES.md)
- [`EVIDENCE_SOURCE_INSPECT_COMPOSER_PROMPTS.md`](EVIDENCE_SOURCE_INSPECT_COMPOSER_PROMPTS.md)
