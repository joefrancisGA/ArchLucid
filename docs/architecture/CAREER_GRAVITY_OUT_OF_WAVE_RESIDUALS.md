> **Scope:** Contributor-reference — career-gravity (CG) explicit out-of-wave skips for CG-100 close audit. Not buyer-facing copy.

# Career-gravity out-of-wave residuals

**Status:** open (feeds [`career-gravity-100-wave-close-audit.md`](../../.cursor/prompts/career-gravity-100-wave-close-audit.md)) · **Do not** mark these rows shipped in CG-100 unless product actually ships them.

| Item | Tracking | Owner prompt | Status | Notes |
|------|----------|--------------|--------|-------|
| In-app changelog / What's new | Product backlog | **CG-098** | **Not shipped** | LW-100 also skipped this. Gravity is doors and stamps, not a product blog. |

## Do not claim

- An in-app **What's new** or changelog surface shipped in career-gravity wave 24.
- CG-098 closed the gap — the prompt exists only to prevent scope creep.

## Ratchet

- `archlucid-ui/src/lib/career-gravity-out-of-wave-residuals.ts`
- `archlucid-ui/src/lib/career-gravity-out-of-wave-residuals.test.ts`
- `ArchLucid.Architecture.Tests/CareerGravityCg098ChangelogInAppNotRequiredArchitectureTests.cs`
