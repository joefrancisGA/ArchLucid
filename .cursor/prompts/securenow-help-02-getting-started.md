# SH-02 — `/help/getting-started` article and drawer

**Do not** rewrite Architecture getting-started. **Do not** globally replace ArchLucid. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Depends on **SN-01**. Hub *summary* in `help-center-catalog-security.ts` already says SecureNow cloud evidence — the **page body does not**.

## Goal

Security `/help/getting-started` orients operators to connect Azure (optional), assign ARC-AMPE packs, triage findings (including assigned-to-me), run remediation factory/patterns, and use infrastructure workbenches. Remove CTAs that navigate to Architecture-only routes (`/architecture/reviews/new`, first-architecture-review, Architectures). Architecture `:3000` keeps the review-flow article.

## Why

`getting-started-help-guide-content.ts` subtitle, diagram (“How ArchLucid works”), pipeline stages, quick start (“Start with your first review”), and Sources (`Start a review` → `/architecture/reviews/new`, `Your first architecture review`) describe the Architecture product. Category-1 on `/help/getting-started` (`help-topic-rows-operator.ts`) says “named architecture identities through review jobs”. Help search topic `getting-started-help` / `how-archlucid-works` still describe architecture evidence → review findings.

Those routes are `isPathAllowedForProductLine(..., "security") === false`. A Security user who follows the help page hits a product-line gate.

## Context

- `archlucid-ui/src/lib/getting-started-help-guide-content.ts`
- `archlucid-ui/src/lib/contextual-help/help-topic-rows-operator.ts` — `/help/getting-started`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts` — featured summary (reuse; do not contradict)
- `archlucid-ui/src/lib/help/help-search-panel-catalog-topics.ts` — `getting-started-help`, `how-archlucid-works`
- `archlucid-ui/src/app/(operator)/help/` getting-started view
- Help markdown pipeline / `localizeHelpCopy` — token rewrite is not enough
- Ground dests: `securenow-security-home-copy.ts`, `securenow-compliance-home-copy.ts`, `securenow-infrastructure-home-copy.ts`

## What to build

1. Product-line-aware getting-started copy: Security subtitle/diagram/pipeline/quick-start/Sources use SecureNow jobs (Azure inventory, ARC-AMPE, findings, remediation, workbenches). Keep slug `getting-started` and anchor `how-archlucid-works` (label via `howProductWorksTitle`).
2. Security Sources must not include `/architecture/reviews/new` or `first-architecture-review`. Prefer assigned-to-me, policy packs, cloud connections (Azure), resource explorer, security-trust.
3. Category-1 drawer on `/help/getting-started` for Security: this page is a SecureNow orientation guide; next step is a live dest from the grouped home, not Architectures/Reviews.
4. Help search descriptions for `getting-started-help` and `how-archlucid-works` when product line is security (SH-25 may finish catalog grouping; this prompt owns these two topic strings if you touch the catalog).
5. Vitest both product lines. Existing tests that require “first review” / architecture request in every getting-started fixture must become product-line-aware.

## Acceptance criteria

- Security getting-started has no live CTA to Architecture-only routes.
- Diagram/quick-start teach cloud evidence → ARC-AMPE findings → remediation, not sealed architecture review finalize.
- Architecture getting-started still teaches evidence → findings → decisions → approval outputs.
- No GitHub blob URLs.

## Constraints

- Do not rename the slug. Do not implement SH-25’s full search IA.
- Stage getting-started copy, drawer row, tests. Markdown cleanup only if the article is markdown-backed and Security presentation is not copy-module-driven.
