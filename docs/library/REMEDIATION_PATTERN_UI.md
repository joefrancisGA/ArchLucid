# Remediation pattern UI (IE-14)

Operate surface for governed remediation pattern lifecycle.

## Route

`/governance/remediation-patterns` (ReadAuthority; mutations require ExecuteAuthority)

## Capabilities

- Pattern registry list with approved version column
- Version history for selected pattern
- Submit for review (Draft → Under review)
- Approve (Under review → Approved) with **segregation of duties** — approve CTA disabled when approver matches `authorActorKey`
- YAML import → always **Draft**; not eligible for production remediation instances until approved

## API

Uses existing `v1/operational-security/remediation-patterns` endpoints.

## Constraints

- No in-place edit of Approved versions (server-enforced transitions)
- No new review-detail tabs
- Import errors surfaced inline; list/detail empty and error states covered by Vitest
