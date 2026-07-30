> **Reviewed:** 2026-07-28

> **Scope:** PA handout for Azure OpenAI model retirement vs reproducibility (GTM **M-274**). Contract: [`../library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md`](../library/AOAI_MODEL_RETIREMENT_REPRO_CLAIM_MAP.md).

# AOAI model retirement — which claims survive

**Audience:** Principal architects, SRE, buyer diligence on replay/repro.

**Claim:** Committed packages and comparison **artifact / stored-source** replay stay true after Microsoft retires a model version. Claims that imply **re-running Real agents on the same pin** become false or fail — silently if the deployment **auto-upgrades**.

---

## Survival matrix (summary)

| Survives | Does not survive |
| --- | --- |
| Committed golden manifest + `ManifestHash` | Bit-identical Real re-execute on retired pin |
| Export lineage / `/export/verify` | Live Real golden-cohort gate on retired pin |
| Comparison `artifact` + stored-source regenerate/verify | Silent ManifestHash continuity after auto-upgrade |
| Simulator / offline cohort baselines | “Replay always re-runs the same model” |

---

## Too strong vs safe

| Too strong | Safe |
| --- | --- |
| “Golden cohort proves perpetual model reproducibility” | Offline baselines ≠ live Real pin immortality |
| “Auto-upgrade preserves ManifestHash identity” | Auto-upgrade preserves **availability**, not **output identity** |
| “Drift detection proves the LLM didn’t change” | Verify-mode drift is vs **stored** sources, not a live model oracle |

---

## Safe pin

> Committed architecture packages remain hash-verifiable relative to stored bytes. Comparison artifact and stored-source regenerate/verify detect drift in **persisted** packages without calling Azure OpenAI. Bit-identical Real re-execution is **not** promised across model retirements or silent deployment upgrades.

**Related:** **M-174**/**M-175** (comparison) · **M-198**/**M-201** (hasher / cohort re-lock) · [`PA_CLAIM_HONESTY_INDEX.md`](PA_CLAIM_HONESTY_INDEX.md).
