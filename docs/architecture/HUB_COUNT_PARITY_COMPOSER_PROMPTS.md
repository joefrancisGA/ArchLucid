> **Scope:** Copy-paste Composer prompts that apply the **Home counting/resume contract** to sibling hubs after HOM al-ui-rate (`#1539` / `#1550` / `#1563`). Internal engineering only — not buyer-facing copy.
> **UI standard:** [`../library/UI_DESIGN_SYSTEM.md`](../library/UI_DESIGN_SYSTEM.md)
> **Paste-ready files:** [`.cursor/prompts/hub-count-parity-00-index.md`](../../.cursor/prompts/hub-count-parity-00-index.md) (**HCP-01–05**)
> **Do not fork:** LS-08 (Home one resume), CD-11 (Home last-open package), AD-07 (hub table columns), help-topic `/al-ui-rate` buyer-polish

# Hub count parity — Composer prompts (HCP-01–HCP-05)

**Created:** 2026-09-05 · **Status:** ready to run · **Do not re-run HOM `#1539`/`#1550`/`#1563`, LS-08, CD-11, or AD-07.**

Home already has one tenant-scoped counting snapshot, self-describing metrics (`SelfDescribingMetricCount`), one filled resume CTA, and attention-chip suppression. Reviews hub, sponsor KPIs, and a few remaining strips still disagree on counts or show two Continue primaries.

This set applies that **contract**, not the Home layout. It does **not** copy Your-work rails onto other pages. It does **not** restyle help topics. It does **not** touch leaf Continue-last-viewed rows that are the only resume on that list.

Paste **one** `.cursor/prompts/hub-count-parity-NN-*.md` file per Composer session. Do not implement from this document’s tables.

## Diagnosis → prompt

| Class | Prompt | Residual after HOM |
|-------|--------|--------------------|
| Two resume primaries | **HCP-01** | Reviews hub Continue strip + Continue last viewed both `primary` |
| Duplicate chrome | **HCP-02** | Hub compact attention strip has no `suppressKinds` |
| Disagreeing counts | **HCP-03** | Hub summary mixes showcase spine counts; metrics lack scope |
| Unscoped sponsor KPIs | **HCP-04** | Sponsor queue tiles are raw numbers, not `SelfDescribingMetricCount` |
| Bare remaining strips | **HCP-05** | Audit / standards / policy-packs numbers without scoped drill-through |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **HCP-01** One resume | First | Do not fork LS-08 |
| **HCP-02** Attention suppress | After 01 | Continue zone visibility |
| **HCP-03** Counting contract | After 01 | Reuse `metric-count-presentation.ts` |
| **HCP-04** Sponsor KPIs | Independent of 01–03 | Do not copy Home four-up cards |
| **HCP-05** Remaining strips | After 03/04 preferred | Only convert queue counts |

## Intentional — do not “fix”

- Home section composition (Your work / Recent / Working desk).
- Help-topic buyer-polish skip link / claim discipline / Where to go next.
- Findings-queue header metrics (already `SelfDescribingMetricCount`).
- Wave 38 filter URL sync.
- Leaf Continue-last-viewed rows with a single resume affordance.
- Desktop review workspace tabs (no **More** menu).

## Global constraints

See [`.cursor/prompts/hub-count-parity-00-index.md`](../../.cursor/prompts/hub-count-parity-00-index.md). No desktop **More** menu; no GTM cohorts **M-90 / M-44 / M-91 / M-92**; no reopening **TB-135 / TB-136**; TB-645 vocabulary; focused Vitest; scoped compile only for C#.
