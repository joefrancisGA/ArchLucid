> **Scope:** Policy-pack breadth expansion decision — hold until measured decision impact.

# Policy-pack breadth expansion decision

**Audience:** Founder / product owner, governance engineering.  
**Last reviewed:** 2026-06-16  
**Decision:** **HOLD** — do not expand policy-pack breadth before pilots show decision impact.

---

## Question

Did buyers or paid pilots require **additional policy packs beyond the V1 baseline set** to approve or reuse ArchLucid?

---

## Evidence reviewed

| Source | Signal |
| --- | --- |
| V1 baseline seed | Five enabled baseline packs (2026-06-16 engineering batch) |
| [`DEFAULT_POLICY_PACK_CALIBRATION.md`](DEFAULT_POLICY_PACK_CALIBRATION.md) | Dry-run → enforce calibration path exists |
| [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md) | Governance trend is stickiness signal — not pack count |
| Assessment 2026-06-16 | Diminishing returns on breadth without decision impact data |

**Pilot notes:** No cohort evidence that pack **count** — vs pack **calibration** — blocked sponsor send.

---

## Conclusion

Expand packs when a **named buyer policy** maps to a measured finding gap in **≥2** sessions — not speculatively.

Prefer:

- Calibrating existing packs (dry-run evidence)
- Recording which pack rules fired in sponsor narrative
- Second-review governance trend metrics

---

## Revisit triggers

| Trigger | Action |
| --- | --- |
| Paid pilot names specific compliance framework pack as go-live requirement | Size **one** pack as TB item with buyer co-design |
| Critical finding repeatedly missed that a known pack would catch | Add rule text + eval fixture — see [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) |
| Compare/drift shows governance regression | Tune enforce thresholds before new packs |

---

## Action

- [ ] **No breadth expansion sprint**
- [ ] Capture pack requests in pilot notes with `policy-pack-demand` tag
- [ ] Reassess after [`SECOND_REVIEW_HABIT_LOOP_VALIDATION.md`](SECOND_REVIEW_HABIT_LOOP_VALIDATION.md) cohort

---

## Related

- [`V1_SCOPE.md`](../library/V1_SCOPE.md)
