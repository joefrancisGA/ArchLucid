# RS-14 — Finding merge conflicts belong on the Working list

**Do not fork RS-11.** RS-11 owns 409 recovery on draft/disposition forms. This file is the leftover: **finding merge conflicts can hide on inspect-only**.

## Goal

When the governance findings queue (or review-detail findings list) already knows a merge conflict exists, Working shows a list-row cue and a resolve control without requiring `/findings/[id]/inspect` as the only door. Guided may keep inspect-first. Do not invent a second conflict API.

## Why

Livelihood triage happens on the list. `FindingMergeConflictResolvePanel` exists. If it only mounts on inspect, two architects (or a re-review) can leave conflicts invisible on the desk the operator actually uses. Casual tools bury exceptions in detail pages.

## Context

- `archlucid-ui/src/components/findings/FindingMergeConflictResolvePanel.tsx`
- `archlucid-ui/src/lib/governance/finding-merge-conflict-api.ts`
- Governance findings queue: `GovernanceFindingsQueueClient.tsx`
- Review-detail findings workspace
- OpenAPI `finding-merge-conflicts` paths
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Grep where merge-conflict payloads already exist on queue/list DTOs. If the field is present, render a compact Working cue + open resolve (panel or inspect with hash). If the field is absent, do **not** invent a new list endpoint this session — document the gap and add a queue-row cue only where the API already returns conflict.
2. Reuse `FindingMergeConflictResolvePanel`; do not fork a third resolve UI.
3. Copy: conflict is unresolved; not “error” styling that looks like a failed pipeline.
4. Vitest: fixture with a conflict id shows the list cue in Working; Guided may omit the cue if inspect remains the teaching path.

## Acceptance criteria

- A Working queue/list that already has conflict data does not require hunting inspect to learn a merge is blocking.
- Resolve still writes the existing API; original rows remain until resolved per current product rules.
- Desktop tabs are not collapsed.

## Constraints

- Do not add presence avatars.
- Tenant isolation on any new read.
- Do not change `typed-engine-protected`.
