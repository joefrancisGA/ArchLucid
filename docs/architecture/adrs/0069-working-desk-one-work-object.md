> **Scope:** ADR 0069 — Working desk presents one resumable work object; Guided keeps ADR 0067 peer entry points.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0069: Working desk is one work object

- **Status:** Proposed
- **Date:** 2026-09-05

## Context

ADR 0067 (Accepted) records that **Create architecture** and **Review** are co-equal entry points for buyer-eval and Guided seats — neither is the other's prerequisite in copy, navigation weight, or CTA hierarchy. That decision remains correct for teaching and first-run evaluation.

The livelihood diagnosis (R13 / ADR 0052) is different for the **paying Working desk**: a repeat professional opens ArchLucid many times per day. Asking them to self-classify into two start products before they have a vocabulary is an evaluator pattern, not an instrument pattern. Waves 1–7 shipped overlays (Working default, `resolveProductionDeskChrome`, honesty lines) but left two peer start CTAs on Working Home.

ADR 0068's two kernels (synthesis ≠ review execute) are unchanged. Draft and sealed artifacts stay unequal; `DraftRequests` and `Runs` are not merged. Spawn lock after handoff remains.

**Related:** ADR 0067 (Guided / buyer-eval only), ADR 0068 (kernels), ADR 0052 (seat license).

## Decision

1. **Working seat:** ArchLucid presents **one resumable work object** whose durable outcome is a sealed review record. The primary CTA resumes last in-flight review, last-open draft, or opens a new draft editor — not a chooser between two products.
2. **Capabilities, not competing primaries:** Drafts list and Packages list remain reachable as secondary navigation (links, palette rows, sidebar nouns). They are not rendered as two equal filled buttons that name two start products on Working Home.
3. **Guided / demo / trial:** ADR 0067 unchanged — co-equal Create architecture and Review when both appear; no Step 1 / Step 2 funnel copy.
4. **Start routing (IS-03):** Alt+N, sidebar start, Home primary, and palette "New work" resolve through `resolveWorkingStartHref` — in-flight review first, then draft editor (unless spawn-locked), then `/architecture/architectures/new`. Path chooser and Socratic wizard remain on Guided and explicit `?path=guided-intake` links only.
5. **Artifact honesty:** A draft is mutable and unsealed; only a sealed review record is export-bearing. Copy must never imply a draft is a sealed record.

## Trade-offs

**Gains:** Muscle memory for repeat professionals; Home reads as "resume my work" instead of "pick a product"; aligns UI identity with R13 seat licensing without rewriting ADR 0067 for eval seats.

**Sacrifices:** First-run Working tenants with zero history see a single path (new draft editor) that is less pedagogical than Guided's two doors; sales demos on Working must not be mistaken for Guided onboarding; maintainers must branch Working vs Guided in tests (`create-review-peer-parity.test.tsx` splits fixtures).

**Rejected:** Demoting Create architecture to a hidden submenu (loses discoverability for new-version / clone-from-snapshot); rewriting ADR 0067 in place (immutability); merging draft and review persistence (violates ADR 0068 and spawn lock).

## Constraints

- ADR 0067 and ADR 0068 bodies are not rewritten — this ADR supersedes 0067 **for Working chrome only**.
- TB-1539 / TB-1544 single-primary-per-hub: Working Home has one primary; hub headers may still have one primary each.
- Desktop review workspace tabs stay a full strip — no More-menu collapse.
- No database merge of `DraftRequests` and `Runs`.
- No GTM cohort work (M-90, M-44) authorized by this ADR.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`, TB-645 vocabulary.

## Expected impact

**System:** Working Home, nav start item, palette, and Alt+N route through a shared resolver; Guided surfaces unchanged. No API schema migration for core run/draft aggregates.

**Security:** No change to tenant isolation (ADR 0037) or sealed-manifest immutability (ADR 0039). Presentation-only for entry chrome.

**Operations:** Vitest guards split ADR 0067 (Guided) from ADR 0069 (Working). CI failure modes: two peer primaries on Working Home, or ordinal funnel copy on Guided.

**Cost:** No infrastructure cost; ongoing reviewer attention on Working vs Guided branches in home/nav PRs.

**Teams:** Agents cite 0069 to refuse two peer start products on Working; Guided contributors continue citing 0067 for parity tests.

## Consequences

- **Positive:** Paying desk identity matches livelihood use; eval seats keep explicit two-job teaching.
- **Negative:** Marketing screenshots must label Working vs Guided; residual buyer-polish call sites still need IS-08 inventory pass.
- **Follow-ups:** IS-02/03 product wiring; IS-13 server continuity for last-open across devices; IS-14 drafts/sealed IA findability.
