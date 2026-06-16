> **Scope:** Canonical first-hour operator golden path — reduces cognitive load while keeping enterprise surfaces available via progressive disclosure.

# First-hour operator path

**Audience:** New tenant operators running their first architecture review  
**Last reviewed:** 2026-06-15

**Operational detail:** [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)  
**Seven-step minimum (full pilot):** [`CANONICAL_FIRST_RUN_PATH.md`](CANONICAL_FIRST_RUN_PATH.md)

---

## Principle: Pilot first, Operate later

The first hour covers **one committed review package** only. Operate compare/replay/graph lanes, governance expansion, and integration catalog depth stay available but are **non-essential** until after first commit.

---

## Four-step first-hour sequence

| Step | Route / surface | Next action state | Success signal |
| --- | --- | --- | --- |
| **1** | `/reviews/new` — New architecture request | Submit request and capture `runId` | Review appears on Home / Runs |
| **2** | `/reviews/{runId}` — Execute review | Run agents and inspect findings summary | Execute completes; findings visible |
| **3** | `/reviews/{runId}` — Commit review package | Finalize golden manifest | `goldenManifestId` present |
| **4** | `/manifests` or run artifacts panel | Review outputs before sponsor handoff | Artifacts downloadable; proof checklist green |

---

## In-product affordances

- **Operator Home** shows the **First-hour path** strip when not in buyer-polished demo mode.
- **Sidebar quick actions** list the same four steps for non-buyer operator shells.
- **Core Pilot checklist** remains the deeper seven-step reference — collapse it when the first-hour strip is sufficient.

---

## Progressive disclosure rules

| Surface | First hour | After first commit |
| --- | --- | --- |
| Pilot: Home, New run, Runs | **Essential** | Essential |
| Operate: Graph, Compare, Replay | Hidden by default | Reveal via **Show analysis & investigation tools** |
| Governance / Audit / Alerts | Secondary links | Use when sponsor or compliance questions arise |
| Admin / Settings | Available; not sequenced | Configure when environment questions block step 1 |

---

## Documentation alignment

UI labels and help slugs reference this document as the canonical first-hour contract:

- In-app help slug: `first-hour-operator-path` (when registered)
- Cross-ref from [`CORE_PILOT.md`](../CORE_PILOT.md) and [`OPERATOR_DECISION_GUIDE.md`](OPERATOR_DECISION_GUIDE.md)

---

## Verification

Walk the four steps in the operator shell with simulator mode. Confirm:

1. Sidebar quick actions match the table above.
2. Advanced routes remain reachable but de-emphasized.
3. No permission regressions on existing operator routes.

---

## Cross-refs

- [`FIRST_HOUR_OPERATOR_PATH.md`](FIRST_HOUR_OPERATOR_PATH.md) (this file)
- [`CANONICAL_FIRST_RUN_PATH.md`](CANONICAL_FIRST_RUN_PATH.md)
- [`CORE_PILOT.md`](../CORE_PILOT.md)
- [`archlucid-ui/docs/OPERATOR_SHELL_TUTORIAL.md`](../../archlucid-ui/docs/OPERATOR_SHELL_TUTORIAL.md)
