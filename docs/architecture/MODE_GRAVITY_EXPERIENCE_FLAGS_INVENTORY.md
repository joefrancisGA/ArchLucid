> **Scope:** Shrink-only inventory — flags and skins that change operator chrome or execute posture. MG-002 owns the table; this file names each knob.

# Mode-gravity experience flags inventory (MG-002)

**Last reviewed:** 2026-09-11 · **ADR:** [0094](adrs/0094-working-one-execute-gravity.md)

| Flag / control | Working effect | Guided effect | Leak risk | Owner |
|----------------|----------------|---------------|-----------|-------|
| `workspaceMode` (`working` / `guided`) | Dense instrument; Career door visible | Eval teaching chrome; no Career door | Medium — wrong mode feels like wrong product | MG-005 |
| `workingCareerRehearsalDoor` (`career` / `rehearsal`) | Execute gravity on Working only | N/A (chooser hidden) | High — unlabeled Simulator Career | CG-001 / 0091 |
| `NEXT_PUBLIC_OPERATOR_EXPERIENCE=operator` | Engineering density (IDs, COGS) | Same density opt-in | Medium — mistaken for Career Mode | MG-004 |
| `NEXT_PUBLIC_DEMO_MODE` | Eval chrome if Working | Eval chrome | High — buyer polish on Working | MG-006 |
| `NEXT_PUBLIC_DEMO_STATIC_OPERATOR` | Static showcase eval chrome | Eval chrome | High — curated demo skin | MG-006 |
| Frictionless trial session | Eval chrome | Eval chrome | Medium — trial treated as Career | MG-006 |
| `NEXT_PUBLIC_OPERATOR_NAV_SHOW_PRE_RELEASE_ROUTES` | Shows pre-release nav (dev/test) | Same | Low — engineer-only | MG-002 |
| Product line (`architecture` / `security`) | Packaging filter; shared doors (CG-017) | Same | Medium — hidden chooser on Security | MG-007 |
| Presenter / CTO tour (`archlucid.buyerCtoDemoTour`) | Eval tour overlay when active | Eval | Medium — tour as default day | MG-021 |
| Host `AgentExecution:Mode` (server) | Structural execute; not a UI flag | Same | High — authority borrowing | MG-014 |
| Run stamp (`executePostureCapturedUtc`, door on run) | Server truth for exports | Same | High — chooser alone insufficient | CG-019 |

**No flag deletion in MG wave** — inventory only. Guided remains eval (MG-013).

## Ratchet

- `archlucid-ui/src/lib/mode-gravity-experience-flags-inventory.ts`
- `archlucid-ui/src/lib/mode-gravity-experience-flags-inventory.test.ts`
