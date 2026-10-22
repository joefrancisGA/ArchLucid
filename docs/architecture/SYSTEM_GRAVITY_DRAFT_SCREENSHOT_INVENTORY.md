> **Scope:** Engineering inventory — SYSTEM GRAVITY DRAFT SCREENSHOT INVENTORY.

# System-gravity — in-flight draft screenshot-as-proof (SG-071)

Working surfaces where an in-flight draft, rehearsal envelope, or unlabeled Ready state can screenshot as Record-complete. Shrink-only — honesty gates stay in CG/CE owners.

| Path | Screenshot risk | Owner | SG |
|------|-----------------|-------|-----|
| `architecture-identity-current-draft.ts` | Spawn-locked draft looks editable until clone CTA | CE-034 / SN-008 | **SG-079** |
| `ArchitectureDraftHandoffPanel.tsx` | Handoff panel can read like continue-in-review | SN-013 | **SG-049** (landed) |
| `ArchitectureIdentityDeskCurrentDraft.tsx` | Current draft slot on desk | SN-017 | **SG-072** |
| `cheap-exploration-envelope-not-career-complete.ts` | Envelope complete ≠ Career seal | CE-012 | ratchet |
| `governance/simulator-career-honesty.ts` | Simulator Rehearsal blocks Career finalize | CG-030 | ratchet |
| `runs/run-progress-tracker-career-honesty.ts` | Rehearsal incomplete terminal status | CE-012 | ratchet |
| `PreFinalizeChecklistPanel.tsx` | Ready to finalize on review-detail | CG-030 | CG-002 inventory |
| `career-gravity-unlabeled-ready-inventory.ts` | Unlabeled Ready literals scan | CG-002 | cross-ref |
