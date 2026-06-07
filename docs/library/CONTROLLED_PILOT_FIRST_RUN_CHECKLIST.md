> **Scope:** Operator cookbook — V1 controlled-pilot golden path from empty tenant to sponsor-safe proof packet.

# Controlled-pilot first-run proof checklist

**Last reviewed:** 2026-06-07

**Audience:** Operators and evaluators running a sales-led controlled pilot.

## Paths (pick one)

| Path | When to use | Claim posture |
| --- | --- | --- |
| **Simulator-only** | CI parity, dry demos, no AOAI credentials | Simulator labels on all sponsor exports |
| **Partial-real** | Some agents on live model with caveats | Partial-real wording + evidence-basis labels |
| **Full-real** | Staging with current real-mode gate PASS | Full-real only when `real-mode-claim-gate.json` is PASS |

## Checklist (60–90 minutes)

| Step | Action | Success signal | Doc |
| --- | --- | --- | --- |
| 1 | Configure tenant auth and SQL (or use hosted staging). | `GET /health/ready` healthy. | [FIRST_RUN_WALKTHROUGH.md](FIRST_RUN_WALKTHROUGH.md) |
| 2 | Sign in; open **New review** (`/reviews/new`). | Wizard loads without auth errors. | [DEMO_QUICKSTART.md](../go-to-market/DEMO_QUICKSTART.md) |
| 3 | Create request; note **run id**. | Run appears in Reviews. | [operator-shell.md](operator-shell.md) |
| 4 | Upload Azure extractor ZIP (Tier 1) or attach evidence. | Upload 200; evidence on run. | [AZURE_EXTRACTOR.md](AZURE_EXTRACTOR.md) |
| 5 | **Execute** agents. | **Ready for commit** or actionable failure + correlation id. | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| 6 | Resolve governance warnings; **Commit** manifest. | Manifest id visible; execution mode persisted. | [V1_SCOPE.md](V1_SCOPE.md) |
| 7 | Verify run detail shows **execution mode** and **evidence basis**. | Real/Simulator/Fallback/Mixed + basis labels. | [CLAIM_READINESS_STATUS.md](../go-to-market/CLAIM_READINESS_STATUS.md) |
| 8 | Collect proof packet. | `collect-first-pilot-proof.ps1` PASS/WARN with limitations.md. | [FIRST_RUN_EVIDENCE_CHECKLIST.md](../runbooks/FIRST_RUN_EVIDENCE_CHECKLIST.md) |
| 9 | Export sponsor packet / executive review. | Labels present; no overclaim language. | [PILOT_GUIDE.md](PILOT_GUIDE.md) |

## Expected artifacts

- Committed run with manifest id
- Proof folder: `run-evidence.json`, `limitations.md`, `environment.json`, `governance-outcome-summary.json`
- Sponsor export with execution mode + evidence basis sections

## Failure interpretation

- **Governance block on commit:** read API problem detail for blocking rule and minimum unblock action.
- **Real-mode HOLD:** do not use full-real sponsor wording; use simulator-only or partial-real per claim gate.
- **Proof-packet WARN:** missing ROI baseline or demo tenant — hold external send until resolved.

## Related

- [LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md)
- [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md)
- [STRICT_RC_EVIDENCE_CAPTURE.md](STRICT_RC_EVIDENCE_CAPTURE.md)
