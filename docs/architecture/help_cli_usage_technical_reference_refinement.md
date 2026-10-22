# CLI usage technical reference refinement (`/help/cli-usage`)

**Backlog:** TB-948 (Done 2026-07-22)  
**Route:** `/help/cli-usage`  
**Workbook:** HCX

## Summary

Refined `/help/cli-usage` from a single long markdown page with a flat right-rail table of contents into a navigable technical-reference experience: reference landing summary, hierarchical collapsible index, in-page section filter, stable deep links with copy-link actions, and a wider desktop content column for dense command and configuration tables — without removing technical depth from `docs/library/CLI_USAGE.md`.

## Page responsibility

| Question | Answer |
| --- | --- |
| Exact question answered | How do I run and automate the `archlucid` CLI, configure `archlucid.json`, resolve API URLs, interpret exit codes, and use REST starter fixtures? |
| Intended reader | Integration developers, platform engineers, API consumers |
| Conceptual vs normative | Overview + command tables remain in authoritative markdown; landing card orients readers only |
| Generated vs manual | Manual markdown (`docs/library/CLI_USAGE.md`) with Vitest drift guard on `##` section anchors |
| Route decomposition | **Single route** — sections answer the same CLI reference question; split would fragment deep links |

## Content source inventory

- Registry: `archlucid-ui/src/lib/product-documentation-registry.ts` → `cli-usage` → `docs/library/CLI_USAGE.md`
- Rendering: dedicated `HelpCliUsageTechnicalReferenceView` (server) + `MarketingAccessibilityMarkdownFragment` (`presentation="help"`)
- Navigation island: `HelpTechnicalReferenceNavigation` (client) — search + hierarchical index only

## Index + search design

- Flat `##` / `###` headings extracted with `extractHelpMarkdownHeadings`
- Grouped via `groupHelpMarkdownHeadings` into collapsible `<details>` sections (first three groups open by default; active hash expands matching group)
- In-page filter matches section titles and slug fragments; shows match count and honest empty state
- Copy-link buttons per major `##` section (`HelpTopicSectionCopyLink`)

## Layout

- Article max width `72rem`; content column `lg:max-w-[52rem]` (wider than default `max-w-3xl` prose)
- Right rail `16.5rem` / `18rem` at `lg` / `xl` for hierarchical index
- Skip link to `#cli-usage-reference-content`

## Terminology + drift controls

- Prohibited audience terms guarded in `CLI_USAGE_HELP_PROHIBITED_AUDIENCE_TERMS` + Vitest
- Removed customer-facing **V1** release label from REST fixtures prose in `CLI_USAGE.md`
- `HelpTopicCliUsage.test.tsx` asserts major `##` anchor ids match authoritative markdown (14 sections)

## Files changed

- `archlucid-ui/src/lib/help/help-markdown-heading-groups.ts` (+ tests)
- `archlucid-ui/src/lib/help/help-cli-usage-reference-content.ts`
- `archlucid-ui/src/lib/help/help-page-layout.ts` (+ test)
- `archlucid-ui/src/components/help/HelpTechnicalReferenceNavigation.tsx` (+ test)
- `archlucid-ui/src/components/help/HelpTopicSectionCopyLink.tsx`
- `archlucid-ui/src/app/(operator)/help/_sections/HelpCliUsageTechnicalReferenceView.tsx`
- `archlucid-ui/src/app/(operator)/help/[...topic]/page.tsx`
- `archlucid-ui/src/app/(operator)/help/HelpTopicCliUsage.test.tsx`
- `docs/library/CLI_USAGE.md` (buyer-path wording)

## Remaining limitations

- Reference body remains markdown-authored (not generated from CLI option metadata)
- In-page search filters the index only (not full-text body search)
- Per-row table expansion and machine-readable schema download not added in this pass

## Tests run

- `npx vitest run src/lib/help/help-markdown-heading-groups.test.ts src/components/help/HelpTechnicalReferenceNavigation.test.tsx src/app/(operator)/help/HelpTopicCliUsage.test.tsx src/lib/help/help-page-layout.test.ts`
