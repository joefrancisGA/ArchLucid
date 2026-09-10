# V12-02 — Merge wave 22 PR without re-implementation

**Wave:** v12 quality-ROI (**V12-02**). **Cluster:** process / merge readiness. **Depends on:** V12-01 preferred (AS-094) but not blocking if parallelized.

Do not implement from the index. Implement only *What to build*.

## Goal

Make PR `#2758` (`cursor/as-prompt-queue-close-97a4`) mergeable onto current `origin/master` without re-implementing AS-001–AS-100 bodies.

## Why

v12 mechanism score **83.91%** lives on branch; trunk still reads ~81.8%. Re-implementation wastes tokens and risks regressions.

## Context

- `docs/architecture/ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md` — wave 22 close audit
- Branch delta: ~9 commits ahead of master (share stack, semantic band wire, distribution clean)
- Master HEAD: check `git log origin/master -1`

## What to build

1. `git fetch origin master` and rebase (or merge) wave 22 branch onto current master.

2. Resolve conflicts **minimally** — prefer master's unrelated changes; keep wave 22 spine files on conflict in AS-owned paths.

3. Run scoped verification (do not full-solution build):
   - `dotnet test ArchLucid.Api.Tests --filter "FullyQualifiedName~Share|FullyQualifiedName~OpenApiContract"`
   - `dotnet test ArchLucid.Application.Tests --filter "FullyQualifiedName~ArchitectureShare"`
   - `dotnet test ArchLucid.Architecture.Tests --filter "FullyQualifiedName~ArchitectureSpineAs0"`
   - `pnpm --dir archlucid-ui exec vitest run ArchitectureIdentityDeskSharePanel FindingSemanticSupportBandChip`

4. Update acceptance doc date/conflict notes only if master moved relevant ADRs.

5. Push rebased branch; ensure PR shows MERGEABLE.

## Acceptance criteria

- PR mergeable with green scoped tests above.
- No re-opened AS implementation batches in the diff (conflict resolution only).
- OpenAPI snapshot still matches controllers if regen was needed during rebase.

## Constraints

- **Do not** re-implement AS-001–AS-093 from prompt bodies.
- **Do not** push directly to `master` unless owner explicitly asks.
- Stage only conflict-resolution and test-fix paths.
- **Do not** start wave 23 concurrent desk in this prompt.
