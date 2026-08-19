> **Scope:** Contributor-reference — when golden-cohort re-lock remains a regression guard vs becomes a rubber stamp, and which invariants must never be re-lockable (TB-1172). Complements dual-hasher naming (**TB-1156** **Done**).

# Golden-cohort re-lock vs rubber-stamp (TB-1172)

> **Audience:** Contributors, release engineers, principal architects, and GTM claim reviewers evaluating cohort SHA / nightly drift language.  
> **Not** a buyer assurance claim — ritual boundaries describe engineering honesty; they do not prove Simulator output correctness.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#golden-cohort-relock-vs-rubber-stamp-m-202) (GTM **M-201** / **M-202**).  
**Path-stable alias:** [`GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_PA_ONE_PAGER.md`](../go-to-market/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_PA_ONE_PAGER.md).  
**Dual hasher surfaces:** [`MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md`](MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md) (**TB-1156** **Done**).  
**Anti-rubber-stamp CI:** **TB-1173** (shipped — `scripts/ci/check_golden_cohort_relock_rubber_stamp_honesty.py`; Vitest `archlucid-ui/src/lib/golden-cohort-relock-honesty.test.ts`). **Operator runbook:** [`tests/golden-cohort/README.md`](../../tests/golden-cohort/README.md).

---

## Decision in one line

Intentional Simulator content re-lock with recorded rationale is **allowed** (exemplar: 2026-07-25 20/20 after named commit-path changes). A mass SHA rewrite without owning the product change is a **rubber stamp** — green nightlies stop meaning “no unintended regression.” Cohort re-lock **never** heals production `ManifestHash` / export verify.

---

## Regression guard vs rubber stamp

### Still a regression guard when

| Condition | Why it counts |
|-----------|---------------|
| Intentional content/projection change named in PR + README lock note | Operator owns the delta |
| **Simulator-only** capture (`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=false`, `AgentExecution__Mode=Simulator`) | Eval baseline is not Real-mode capture |
| Hasher B (`GoldenManifestFingerprint.ComputeContentSha256Hex`) unchanged, **or** Hasher B include-set change explicitly called out | Aligns with **TB-1156** dual-hasher table |
| Expected finding **categories** unchanged unless intentionally revised | Category asserts still meaningful |
| `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED=true` remains true after owner verification | Claim lock coherence (**Done TB-266**) |
| Single-shot `ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCK_APPROVED` per `lock-baseline --write` | Each re-lock needs fresh operator ack |
| Re-lock rationale cites product change (not “make CI green”) | Distinguishes guard from stamp |

### Becomes a rubber stamp when

| Smell | Required response |
|-------|-------------------|
| Unexplained mass SHA rewrite (e.g. 20/20 with no intentional-change sentence) | Treat as review finding; do not cite green nightlies as stability proof |
| Re-lock to silence nightly without owning the product change | Reject or require rationale per **TB-1173** |
| Real LLM / Real agent mode capture sold as Simulator baseline | **Forbid** — INV-002 mode honesty; Real path is measure-only |
| Cohort SHA rewrite used to “heal” production `ManifestHash` / export verify | **Forbid** — separate rituals (**TB-1156**, **TB-1157**) |
| Placeholder SHAs while `/why` or docs still claim locked drift | **Forbid** — **Done TB-266** claim lock |
| `continue-on-error` on locked assert papers over unlock/placeholder drift | Engineering tighten in **TB-1173** |

---

## Never re-lockable (fix the product or the other surface — not `cohort.json`)

| Invariant | Correct surface | Notes |
|-----------|-----------------|-------|
| Production `ManifestHashService` semantics for historical rows | **TB-1157** deliberate production re-lock | Cohort.json cannot rewrite authority hashes |
| Buyer unit-of-truth = committed `GoldenManifestId` + authority `ManifestHash` | **TB-1003** / GTM **M-155** | Content fingerprint ≠ production verify |
| Equating content fingerprint with `ManifestHash` in buyer/proof language | GTM **M-198** | Dual-hasher honesty |
| Execution-mode honesty (Simulator vs Real) | INV-002 / **TB-969** **Done** | Do not capture Real as Simulator baseline |
| Claim lock coherence while placeholders remain | **Done TB-266** | `BASELINE_LOCKED` must match repo SHAs |
| Sealed committed manifest bytes / sealed-row rewrite | **TB-1277** / GTM **M-224** | Storage/schema compat ≠ content migration |

---

## May re-lock with ritual

| Artifact | When | Ritual |
|----------|------|--------|
| `expectedCommittedManifestSha256` in `tests/golden-cohort/cohort.json` | Documented intentional Simulator/commit-path content change | `golden-cohort lock-baseline --write` + env approval + PR rationale + README lock table row |
| Optional per-row finding category expectations | Intentional category taxonomy change | Same ritual; call out category delta in PR |
| Hasher B include/exclude set change | Deliberate contract projection change | Re-lock + cite **TB-1156** Hasher B table; do not conflate with Hasher A |

**Exemplar (allowed):** 2026-07-25 — all 20 Simulator content SHAs re-locked after intentional commit-path/projection changes; categories unchanged; capture method documented in [`tests/golden-cohort/README.md`](../../tests/golden-cohort/README.md).

---

## Cohort vs production re-lock (do not conflate)

| Ritual | Owns | Does **not** substitute for |
|--------|------|------------------------------|
| Cohort lock-baseline | Eval fixture content SHA (`Hasher B`) | Production `ManifestHash` (**Hasher A**) |
| Production deliberate re-lock (**TB-1157**) | Authority hash continuity after subset change | Cohort green after silent Hasher A change |
| Claim lock (`BASELINE_LOCKED`) | Repository honesty that SHAs are non-placeholder | Healing export verify for old commits |

---

## TB-1173 CI anchors (shipped)

| Anchor | Purpose |
|--------|---------|
| `scripts/ci/check_golden_cohort_relock_rubber_stamp_honesty.py` | Buyer-doc guard for rubber-stamp / cohort-heals-ManifestHash claims |
| `tests/golden-cohort/cohort.json` mass SHA diff detector | Fail PRs changing ≥50% of expected SHAs without rationale file/section (future tighten) |
| `scripts/ci/assert_golden_cohort_baseline_locked.py` | Merge-blocking when `BASELINE_LOCKED=true`; optional remove `continue-on-error` |
| `GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT.md` or README lock table | Required citation for mass re-lock PRs |
| Buyer/proof stub guards | Fail “cohort re-lock healed ManifestHash” / unexplained mass rewrite as proof |
| `GoldenCohortSimulatorDriftTests` / nightly `cohort-simulator-drift` | Regression signal — not stability attestation after rubber stamp |

---

## Explicit non-claims

- Green 20/20 after mass unexplained rewrite ≠ product stability.
- Cohort re-lock ≠ production export verify repair (**Done TB-307** scope unchanged).
- Re-lock contract ≠ enabling Real-LLM cohort as Simulator baseline (**PQ-15** budget gate).
- This contract does not reopen **Done TB-266** claim-lock mechanics.

---

## Related

- [`MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md`](MANIFEST_DUAL_HASHER_PROJECTION_EVOLUTION_CONTRACT.md) · **TB-1157** · **TB-1003**
- [`tests/golden-cohort/README.md`](../../tests/golden-cohort/README.md) · GTM **M-154** · **Done TB-307**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-1172**–**TB-1173**
