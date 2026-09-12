> **Scope:** Engineering inventory — SYSTEM GRAVITY FINALIZE EXILE INVENTORY.

# System-gravity — finalize only on review-detail (SG-006)

| Path | Leak | SG |
|------|------|-----|
| `CommitRunButton.tsx` | Finalize CTA only mounts on review-detail routes | **SG-022** (desk row verb) |
| `ReviewPackagePrimaryAction.tsx` | Finalize primary on review package | **SG-022** |
| `ArchitectureIdentityDeskReviewsTable.tsx` | No Ready-to-finalize on child job row | **SG-022** |
| `finalize-success-desk-href.ts` | Helper exists; unwired from success flow | **SG-022** |

