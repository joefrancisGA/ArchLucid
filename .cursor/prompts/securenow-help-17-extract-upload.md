# SH-17 — Extract and upload `/governance/infrastructure/extract-upload`

**Do not** map Learn more to `evidence-intake`. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Architecture `/administration/extract-upload` is **Architecture-only**. This prompt is the Security extract-upload page. If you touch shared copy modules, branch on product line so Architecture can keep “start a review”.

## Goal

Category-1, page Sources, and Learn more for Security extract-upload: run the read-only Azure extractor locally, validate ZIP, upload inventory for **SecureNow inventory workbenches / ARC-AMPE scans**. Next step is resource explorer, drift, or policy packs — not `/architecture/reviews/new`.

## Why

`workspace-administration-rows.ts` uses the same “upload inventory for architecture reviews” / “Open Start a review” copy for both `EXTRACT_UPLOAD_SETTINGS_CANONICAL_PATH` and `GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH`.

`extract-upload-settings-evidence-copy.ts` Sources: Evidence intake help, Start a review, Architecture reviews.

Topic map: both extract-upload prefixes → slug `evidence-intake`. Evidence-intake help is “Start a review guide”.

Live Security page is inventory ZIP for Azure evidence (package name `securenow-azure-package.zip` in Security copy).

## Context

- `archlucid-ui/src/lib/contextual-help/workspace-administration-rows.ts`
- `archlucid-ui/src/lib/extract-upload-settings-evidence-copy.ts`
- `archlucid-ui/src/lib/usability/page-help-topic-rows-admin-integrations.ts`
- Extract-upload client (governance/infrastructure vs administration)
- `archlucid-ui/src/lib/product-line/product-line-display-name.ts` — zip name rewrite
- Evidence-intake help (do not rewrite Architecture article in this prompt)

## What to build

1. Security Category-1 for `GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH` only (or product-line branch if the module is shared). what = local Azure extractor + ZIP upload for inventory; next = copy command, upload, then open resource explorer (or drift); empty = controls ready with authority; configure = Admin/Execute. **No** Start a review.
2. Security Sources: cloud connections Azure, resource explorer, drift, policy packs, connect-azure help. Remove Architecture reviews / evidence-intake / `/architecture/reviews/new`.
3. Learn more: `cloud-connections-azure` or a short extract-upload article — **not** `evidence-intake`.
4. Vitest: Security extract-upload help has no architecture review CTAs; Architecture admin extract-upload may keep them.

## Acceptance criteria

- Security F1 and Sources never link to Architecture-only routes.
- Package filename in Security remains the SecureNow zip name if already rewritten.
- Architecture admin extract-upload unchanged.

## Constraints

- Do not change extractor scripts beyond copy. Do not weaken read-only honesty.
- Stage extract-upload copy + rows + topic map + tests.
