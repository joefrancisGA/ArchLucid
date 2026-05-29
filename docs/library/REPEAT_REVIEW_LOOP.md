> **Scope:** Operator guide for second and subsequent committed reviews — V1 surfaces only.

# Repeat-review stickiness loop

**Audience:** Pilot operators and architecture leads **after the first committed review**.

**Last reviewed:** 2026-05-29

**Prerequisite:** One successful Core Pilot commit ([`CORE_PILOT.md`](../CORE_PILOT.md) · [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) Phase C complete).

---

## Why the second review should show more value

| Stickiness signal | V1 surface | Proof acceptance |
| --- | --- | --- |
| Reused prior decision | Compare / prior manifest retrieval | Second review references first manifest id in findings or compare output |
| Repeated finding category trend | Product learning rollups | Category counts shift with real evidence changes |
| Improved cycle time | Run duration metrics · pilot timing budget | Wall-clock or architect hours decrease vs baseline in [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md) |
| Governance trend | Policy pack dry-run → enforce | Fewer critical findings on repeat with same pack |
| Executive ROI rollup | Executive ROI summary export | Sponsor-safe labels; not demo-derived dollars |

---

## Recommended loop (after first commit)

1. **Compare** two reviews — UI compare or API compare endpoints.
2. **Replay** authority pipeline (ReconstructOnly) when investigating regressions — [`V1_RC_DRILL.md`](../library/V1_RC_DRILL.md).
3. **Reuse** prior manifest context in a new review when evidence evolves incrementally.
4. **Run governance dry-run** before enforcing BlockCommitOnCritical — [`DEFAULT_POLICY_PACK_CALIBRATION.md`](../go-to-market/DEFAULT_POLICY_PACK_CALIBRATION.md).
5. **Collect proof** again with `-RunId` for the second committed review — disposition should improve or caveats should shrink.

---

## UI / API surfaces (V1)

| Action | UI | API / CLI |
| --- | --- | --- |
| Compare reviews | Operate analysis compare | Compare endpoints per [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) |
| Replay run | Review detail replay | Authority replay routes |
| Executive ROI summary | Exports / sponsor views | Export endpoints with ROI basis labels |
| Governance dry-run | Governance UI | `POST /v1/governance/policy-packs/dry-run` |
| Product learning rollups | Operator analytics where enabled | Product learning docs in [`PRODUCT_LEARNING.md`](../library/PRODUCT_LEARNING.md) |

---

## Second-review proof checklist

- [ ] Second review committed with distinct run id and manifest id.
- [ ] Compare output attached or linked in sponsor narrative.
- [ ] At least one stickiness signal improved or explained (cycle time, governance, repeated category, prior decision reuse).
- [ ] ROI basis remains **buyer-provided** or **defaulted** with labels — not demo-derived outcome claims.
- [ ] Proof disposition SEND or explicit HOLD with remediation — re-run [`collect-first-pilot-proof.ps1`](../../scripts/collect-first-pilot-proof.ps1).

**Not required:** V1.1 connectors, MCP, automated planning beyond existing materialization endpoints.

---

## Deferred (not failures)

- Jira / ServiceNow / Confluence / Slack / Teams connectors — V1.1
- MCP tool membrane — deferred
- Live commerce checkout — sales-led only

See [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).

---

## Related

- Operator decisions: [`OPERATOR_DECISION_GUIDE.md`](../library/OPERATOR_DECISION_GUIDE.md)
- Workflow handoff comments: [`V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`](../runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md)
