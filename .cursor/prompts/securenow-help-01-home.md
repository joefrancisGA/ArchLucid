# SH-01 — Home `/` Category-1 help and Learn more

**Do not** change Architecture home help. **Do not** globally replace ArchLucid. **Do not** hide desktop workspace tabs. Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Depends on **SN-01** display-name helper. If it is missing, stop.

## Goal

When `productLineId === "security"`, Home `/` Category-1 help describes the SecureNow grouped home (Security, ARC-AMPE compliance, Infrastructure destination cards). Learn more must **not** open `/help/first-architecture-review`. Architecture `:3000` home must keep create-architecture / start-review copy and may keep `first-architecture-review` Learn more.

## Why

`ARCHITECTURE_CONTEXTUAL_HELP_ROWS` prefix `/` says “create or review an architecture” and CTAs to `ARCHITECTURES_NEW_PATH` / `REVIEWS_NEW_PATH`. SecureNow home (`InfrastructureOverviewClient` grouped sections + `securenow-*-home-copy.ts`) shows assigned findings, remediation factory/patterns, ARC-AMPE packs/rules/findings/lineage, and Azure inventory workbenches. Learn more is `page-help-topic-rows-operator-architecture.ts` prefix `/` → slug `first-architecture-review`. `localizePageContextualHelpEntry` only rewrites the product name.

## Context

- `archlucid-ui/src/lib/contextual-help/architecture-rows.ts` — `/` entry and working-mode override
- `archlucid-ui/src/lib/contextual-help/registry.ts` — `contextualHelpForPathname` (already takes `productLineId`; cloud-connections hub is the reuse pattern)
- `archlucid-ui/src/lib/usability/page-help-topic-rows-operator-architecture.ts` — `/` → `first-architecture-review`
- `archlucid-ui/src/lib/usability/page-help-topic-map.ts`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts`
- Ground copy from those files: Security lead “Triage assigned findings…”, Compliance “Assign ARC-AMPE…”, Infrastructure “Explore Azure inventory…”

## What to build

1. Product-line branch for prefix `/` in contextual help: Security `whatIsThisPage` names the three grouped sections; `whatToDoNext` starts with assigned-to-me (recommended first) then policy packs / resource explorer; `whyEmpty` is about no assigned findings / no inventory yet — not “recent reviews”; actions link to live SecureNow dests (assigned-to-me, policy packs, or resources), never `/architecture/reviews/new`.
2. Working-mode home override must not apply in Security (or must be Security-desk copy). `resolveArchitectureContextualHelpEntry` currently returns architecture working copy for `/`.
3. `pageHelpTopicForPathname("/")` in Security: Learn more to `/help/getting-started` **only after SH-02** rewrites that article, or omit Learn more until SH-02 lands. Do **not** keep `first-architecture-review`. Prefer passing `productLineId` into the topic map the same way the drawer resolver already does.
4. Vitest: Security home fixture asserts no “architecture identity”, “start a review”, or `/architecture/reviews`. Architecture home fixture still has create-architecture / start-review.

## Acceptance criteria

- Security F1 on `/` describes grouped Security / ARC-AMPE compliance / Infrastructure dests and points at those routes.
- Open full help page is not first-architecture-review.
- Architecture home unchanged.
- Desktop tabs unchanged.

## Constraints

- One concern per file. Do not rewrite getting-started in this prompt (SH-02).
- Scoped Vitest only. Stage contextual-help + page-help-topic map + tests.
