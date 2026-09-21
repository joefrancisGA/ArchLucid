> **Scope:** Claim-safety diff pass for private-beta window (2026-09-14). Canonical boundary: [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md).

# Private-beta claim audit — 2026-09-14

## Automated guards (repo root)

| Guard | Result |
| --- | --- |
| `check_commercial_overclaim_guard.py` | **PASS** |
| `check_proof_language_superlatives.py` | **PASS** |

## Manual review targets (founder before invite wave)

| Surface | Action |
| --- | --- |
| Landing / request-access CTA | No “sign up and pay”; Stripe placeholders only |
| Help / export sendable covers | Execution mode + WK-21 + ROI non-summing stamped |
| Workspace B demos | Never sold as live agents |
| Trust center | No CPA SOC 2 or third-party pen-test publication claims |
| Quick Scan public | Sample-only until **M-110** |

## SEND vs REWRITE (summary)

| Claim class | Verdict |
| --- | --- |
| Governed review + audit reconstruction | **SEND** (with mode labels) |
| Pack-driven gate outcomes | **SEND** (with WK-21 caveat) |
| “SOC 2 certified” / “pen tested by third party” | **REWRITE** — use assurance status honesty |
| Simulator dollars as savings | **REWRITE** |
| “Proven across N pilots” (G4 = 0/3) | **REWRITE** |

## Re-run

```bash
python3 scripts/ci/check_commercial_overclaim_guard.py
python3 scripts/ci/check_proof_language_superlatives.py
```

Full buyer-surface bundle (when diff present): `python3 scripts/ci/run_buyer_surface_strict_guards.py` (requires `python` on PATH or invoke guards individually with `python3`).
