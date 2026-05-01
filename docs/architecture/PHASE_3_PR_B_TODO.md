> **Scope:** Phase 3 PR B (audit-constant retirement) — execution checklist and scratch notes. Removed when PR B merges on `main`.

Authoritative cross-reference is ADR 0029 § Lifecycle § **PR B — audit-constant retirement checklist** ([`0029-coordinator-strangler-acceleration-2026-05-15.md`](../adr/0029-coordinator-strangler-acceleration-2026-05-15.md)). This file is the working surface for PR B execution; it must stay in sync with the ADR checklist and is removed when PR B merges.

## Checklist (mirror of ADR 0029 § Lifecycle § PR B)

- [x] PR A3 has merged on `main` (Coordinator concretes deleted).
- [x] All `AuditEventTypes.CoordinatorRun*` string constants are gone from **`AuditEventTypes`** (verified by **`Legacy_CoordinatorRun_audit_constants_are_removed_from_AuditEventTypes`** in **`ArchLucid.Architecture.Tests/DependencyConstraintTests.cs`** — remaining **`CoordinatorRun`** substrings elsewhere in **`*.cs`** are assertion text only).
- [x] No SQL migration is required — literals were removed in **C#** only (**`ArchLucid.sql`** unchanged for this cleanup).
- [ ] Calendar date 2026-05-15 reached or owner has explicitly approved earlier merge.
- [ ] PR B opened, CI green, owner approves, merged.

## Working notes

- **2026-05-01:** Reconciled with **`COORDINATOR_STRANGLER_INVENTORY.md`** (engineering state + ADR/amend backlog).

Use this section for sequencing, unresolved questions, draft commit links, and grep output snippets. Keep the checklist above aligned with ADR 0029 — the ADR section is the normative list; CI warns when labels drift (`scripts/ci/assert_pr_b_tracker_in_sync.py`).
