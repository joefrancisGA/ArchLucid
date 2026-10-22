> **Scope:** Canonical four-step operator lane for first sponsor-usable output — aligned with UI `FirstValueLanePanel` and assessment improvement #2.

# First-value lane

**Audience:** pilot architects cutting their first finalized architecture package.

**UI surface:** Operator home → **Advanced guidance** → **First pilot progress** → **Operating path** tab (`FirstValueLanePanel`).

**Status markers:** `Not started` · `In progress` · `Completed` · `Blocked`

---

## Lane phases (in order)

| # | Phase | Exit condition | Out of lane (optional) |
|---|--------|----------------|-------------------------|
| 1 | **Create review** | At least one architecture review exists | Azure extractor tuning, multi-project setup |
| 2 | **Execute review** | Assessment results are ready on review detail | Compare, replay, graph |
| 3 | **Commit package** | Golden manifest committed (`hasGoldenManifest`) | Governance approvals beyond first pilot |
| 4 | **Retrieve sponsor artifact** | First-value report / proof packet available from finalized review | Sponsor ROI, procurement pack |

---

## Entry / exit

- **Entry:** net-new tenant with platform health `ready`.
- **Exit:** phase 4 **Completed** — lane complete banner shown in UI.
- **Blocked:** platform health not ready — resolve `/administration/system-health` before continuing.

---

## Validation

```powershell
python scripts/ci/validate_first_value_lane.py
```

Cross-refs: [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md) · [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md) · in-app `/help/first-value-20-minutes`
