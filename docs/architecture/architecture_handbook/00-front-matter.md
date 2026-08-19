# ArchLucid platform architecture handbook

**Version:** `2026.08.17a` (see `VERSION`)  
**Canonical poster:** `docs/ARCHITECTURE_ON_ONE_PAGE.md`  
**Diagram index:** `docs/architecture/architecture_diagrams/`

## Purpose

Provide a single, regenerable document that:

1. Explains the ArchLucid **product platform** end-to-end (system context → containers → pipelines → trust → ops).
2. Specifies the two product kernels — **architecture synthesis** (create) and **review evaluation** (authority pipeline + finding engines) — as typed maps, not marketing synonyms.
3. Embeds the approved zoom-in diagrams next to the prose they illustrate.
4. Points to ADRs and library docs for depth without duplicating every runbook.

## Assumptions

- Azure-first hosting (Container Apps, SQL, private networking) unless a pilot diverges.
- Incomplete requirements and imperfect rollout are normal; backlogs stay observable (outboxes, health, metrics).

## Constraints

- No public SMB; storage and queues use private endpoints and managed identity where possible.
- Single DDL source per database.
- Configuration bridge: `ArchLucid*` keys remain authoritative with legacy overrides until sunset.

## What this handbook is not

It is **not** a customer architecture review package. ArchLucid produces those from evidence through the authority pipeline. This handbook is **platform documentation** maintained in-repo and exported to Word for offline review.
