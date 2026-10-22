> **Scope:** Engineering inventory — SYSTEM GRAVITY REVIEW DETAIL SHELL INVENTORY.

# System-gravity — review-detail as all-day shell inventory (SG-004)

**Generated:** 2026-09-12. Shrink-only; product fixes land in SG-016+.

| Path | Leak class | AO/SY/SN | SG owner |
|------|------------|----------|----------|
| `RunDetailWorkspaceChrome.tsx` | H1/eyebrow still review-centric (`deriveReviewHeaderPresentation`) | Partial (tab title only) | **SG-016** |
| `run-detail-page-presentation.ts` | Server presentation uses buyer review H1 on Working | — | **SG-016** |
| `CommitRunButton.tsx` success modal | Post-finalize "Go to Findings" → `/governance/findings` | — | **SG-022** |
| `RunDetailFindingsWorkspace.tsx` | Governance queue peer link on committed tab | SY-43 route exists | **SG-019** |
| `ReviewPackageDoThisNextStrip.tsx` | Finalize owns page primary inside review shell | SN spawn-lock | **SG-022** |
| `RunDetailWorkspaceStickyActions.tsx` | Sticky finalize/findings inside review chrome | — | **SG-016** |
| `architecture-draft-handoff-gate.ts` | "Continue in the review" / canonical work surface copy | SN handoff | **SG-003** |

