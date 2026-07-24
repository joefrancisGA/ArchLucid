> **Scope:** Customer-facing — operator cookbook guide for second and subsequent finalized architecture reviews — V1 surfaces only.

# Repeat-review stickiness loop

**Audience:** Architects and architecture leads **after the first finalized architecture package**.

**Last reviewed:** 2026-07-22

**Prerequisite:** One successful Core Pilot finalize ([Your first architecture review](/help/core-pilot) · [`CORE_PILOT.md`](../CORE_PILOT.md)).

---

## Why the second review should show more value

| Stickiness signal | V1 surface | Proof acceptance |
| --- | --- | --- |
| Reused prior decision | Compare / prior manifest retrieval | Second review references first signed review record in findings or compare output |
| Repeated finding category trend | Product learning rollups | Category counts shift with real evidence changes |
| Improved cycle time | Review duration metrics · pilot timing budget | Wall-clock or architect hours decrease vs baseline in [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md) |
| Governance trend | Policy pack dry-run → enforce | Fewer critical findings on repeat with same pack |
| Executive ROI rollup | Executive ROI summary export | Sponsor-safe labels; not demo-derived dollars |

---

## Recommended loop (after first finalize)

1. **Compare** two architecture packages — use Compare in the architect workspace.
2. **Replay** a saved comparison when investigating regressions — see [Compare and replay](/help/comparison-replay).
3. **Reuse** prior package context in a new review when evidence evolves incrementally — see [Prior manifest retrieval](/help/prior-manifest-retrieval).
4. **Run governance dry-run** before enforcing a blocking finalize gate — [`DEFAULT_POLICY_PACK_CALIBRATION.md`](../go-to-market/DEFAULT_POLICY_PACK_CALIBRATION.md).
5. **Collect proof** again for the second finalized package — disposition should improve or caveats should shrink.

<details>
<summary>Administrator details — API and CLI surfaces</summary>

| Action | UI | API / CLI |
| --- | --- | --- |
| Compare two reviews | Analysis → Compare | Compare endpoints per [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| Replay review | Review detail replay | Authority replay routes |
| Executive ROI summary | Exports / sponsor views | Export endpoints with ROI basis labels |
| Governance dry-run | Governance UI | `POST /v1/governance/policy-packs/dry-run` |
| Product learning rollups | Analytics where enabled | [`PRODUCT_LEARNING.md`](../library/PRODUCT_LEARNING.md) |

</details>

---

## Second-review proof checklist

- [ ] Second architecture package finalized with a distinct review identity and signed review record.
- [ ] Compare output attached or linked in sponsor narrative.
- [ ] Prior decisions reused or explicitly superseded.
- [ ] Governance dry-run completed before stricter enforce mode (when used).
- [ ] ROI / proof labels remain sponsor-safe.

## Related help

- [Compare and replay](/help/comparison-replay)
- [Architecture packages](/help/review-packages)
- [Accelerator chooser](/help/accelerator-chooser)
- [Your first architecture review](/help/core-pilot)
