# AO-03 — Working copy: Review is a job verb, not a destination product

**Do not fork CA-44 / CA-48** glossary guards. Extend them. **Do not** change Guided two-door copy (ADR 0067).

## Goal

Working chrome, empty states, palette labels, and help `whyEmpty` must not teach Reviews as a peer product you “go to.” Preferred:

- **Open** {architecture name}
- **Start review** / **Resume review** as verbs on that architecture
- **Reviews inbox** only when the surface is the cross-architecture queue

Ban on Working: “Open Reviews” as the Monday CTA; “your reviews” as the portfolio noun.

## Why

ADR 0064 buyer vocabulary renamed run→review. That helped eval. It also trained the SPA to treat Review as the object. R13’s object is the architecture; review is what you **do** to it.

## Context

- `archlucid-ui/src/lib/working-start-route.ts`
- i18n / nav labels for Architectures vs Reviews
- `docs/library/GLOSSARY.md` if Working glossary rows exist
- CA-44 / CA-48 drift guards

## What to build

1. Inventory Working strings that use Reviews as a noun destination on Home, Start, empty portfolio, palette primary.
2. Replace with architecture-noun + review-verb. Keep “Reviews” as the inbox nav label (AO-14).
3. Vitest or eslint-guard on a small denylist of Working Home/Start copy.
4. Guided copy unchanged.

## Acceptance criteria

- Working Home primary does not say “Open reviews” / “Go to reviews.”
- Inbox nav may still say Reviews.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, or 0074 bodies — Related pointers only. This wave **supersedes** 0072’s Working locator and 0069’s in-flight-review-first Start clause via **ADR 0077**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run CA-01–50, DA-01–12, PC-01–13, DR-01–16, or LK except as a named leftover.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).
