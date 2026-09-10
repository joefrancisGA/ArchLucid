# SH-12 — Advisory Terraform `/governance/infrastructure/terraform`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Category-1 for the Terraform mapping workbench. Copy matches the live page: advisory Terraform reconstructed from inventory evidence, not apply-to-cloud, not connector setup, not architecture-review approval.

## Why

`/governance` Approval steal + Learn more `cloud-connections`.

SecureNow home: “Review advisory Terraform mapping reconstructed from inventory evidence.” Read `TerraformWorkbenchClient.tsx` header/helper before writing — reuse on-page honesty (advisory, reconstructed, human review).

## Context

- `archlucid-ui/src/app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx`
- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts`
- Drift workbench also exports advisory Terraform — this page is the mapping workbench; SH-26 is snapshot compare. Do not merge them.

## What to build

1. Prefix `/governance/infrastructure/terraform`. what = advisory Terraform mapping from inventory; next = pick snapshot/scope, inspect mapping, export only after review; empty = after snapshots exist; configure = Azure inventory. Actions: drift (compare/export), resource explorer, Azure connections.
2. Learn more: omit, dedicated slug, or a section of a new infrastructure-overview article — **not** cloud-connections. Do not point at evidence-intake.
3. Vitest: not Approval, not cloud-connections Learn more.

## Acceptance criteria

- F1 says advisory / reconstructed / not a cloud apply.
- No “start a review” or approval-queue CTAs.

## Constraints

- Do not invent apply/execute APIs.
- Stage terraform row + topic map + tests.
