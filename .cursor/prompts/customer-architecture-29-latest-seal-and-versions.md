# CA-29 — Latest seal and version lattice (read-only)

**Do not put sealed bytes on `dbo.Architectures`.** **Do not unseal.** Migration 339 already has `ArchitectureVersions`.

## Goal

Desk shows:

1. Latest sealed record link when `LatestSealedManifestId` is set (existing review/manifest route).
2. Read-only version list if `ArchitectureVersions` rows exist for this identity — id, created, linked review — **not** a new editor.
3. Honesty: versions are pins, not a draft-diff merge UI.

## Why

A livelihood object has history you can point at in an ARB. Hiding the lattice keeps “the latest run” as the only object.

## Context

- `339_ArchitectureVersions.sql`
- `ArchitectureVersionRecord`
- Manifest detail routes
- ADR 0039

## What to build

1. Read-only section + tests: other architecture’s versions excluded; missing latest seal → no fake “Ready” tag.
2. Do not add a 40th engine.

## Acceptance criteria

- Latest seal href opens the sealed record, not the draft.
- Empty lattice does not screenshot as “no versions because none existed” if the API failed — distinguish error vs empty.

## Constraints

- No byte rewrite. No Ready tag that means approved (FD-13).
