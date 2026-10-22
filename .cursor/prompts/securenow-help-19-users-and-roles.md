# SH-19 — Users and roles help, users admin, invite reviewer

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

Do **not** rename built-in role **ids**. Buyer label for Operator is already **Architect** via `roleDisplayLabel` — Security help must not pretend that role means “architecture reviewer” if the Security job is Operate on findings/inventory. Read the live users matrix before rewriting intended-user sentences.

## Goal

Security `/help/users-and-roles`, `/administration/users` drawer, and invite-reviewer drawer describe **SecureNow workspace roles** (Admin, Auditor, Operator/Architect label, Reader) for findings, packs, inventory, and integrations. Remove “Run reviews and manage architecture-package workflows”, “sign off on architecture reviews”, and billing-manage as a primary Security capability if `/administration/billing` is Architecture-only. Architecture help keeps review participation + billing.

## Why

Hub Security summary already says “Admin, Architect, Reader, and Auditor” — article body (`users-and-roles-help-copy.ts`) still: review participation, invite reviewers to view reviews/findings/approval, billing in how-access-works.

`BUILTIN_ROLE_SUMMARIES` Operator: “Run reviews and manage architecture-package workflows”; Reader: “Read-only review access”.

Users admin Category-1: “Invite users and assign ArchLucid app roles” (brand-localizable) but next/empty still directory-shaped — invite-reviewer: “Reader or Auditor access so a teammate can sign off on architecture reviews.”

Capability matrix includes `create-reviews`, `finalize-reviews`, `manage-billing`.

## Context

- `archlucid-ui/src/lib/users-and-roles-help-copy.ts`
- `archlucid-ui/src/lib/users-and-roles-help-manifest.ts`
- `archlucid-ui/src/lib/contextual-help/workspace-administration-rows.ts` — users + invite-reviewer
- `archlucid-ui/src/app/(operator)/administration/users/_sections/roles-matrix-constants.ts`
- `archlucid-ui/src/lib/help/help-center-catalog-security.ts`
- Live users page tabs (read before writing)

## What to build

1. Security help article: how-access-works, role overview intendedUser/summary, review-participation section → **workspace participation** (findings, lineage, inventory) or hide the section in Security if invitations still exist but are not “review sign-off”. Capability rows that are Architecture-only should be omitted or labeled “Architecture product” only if those permissions still exist in the API — do not lie that billing is configured in this shell if the nav hides it; say billing is not administered in SecureNow when that is true.
2. Users admin drawer: product-line-aware what/next; Security CTAs stay on users/roles/SSO, not billing.
3. Invite-reviewer: Security = grant Reader/Auditor to inspect findings/lineage, not “sign off on architecture reviews”.
4. Vitest both lines. Architecture article still has review participation.

## Acceptance criteria

- Security users help does not send operators to `/administration/billing` or architecture review finalize as the job.
- Invite-reviewer F1 matches Security invitations.
- Role **ids** unchanged. Company/legal ArchLucid in SSO/email may remain.

## Constraints

- Do not change authorization in Core in this prompt.
- Stage users help + contextual rows + tests. If you must change `BUILTIN_ROLE_SUMMARIES`, product-line-aware presentation — do not break Architecture matrix tests.
