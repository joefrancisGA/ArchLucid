> **Scope:** Owner decision packet for PP-01 follow-up gap 2 — extending `ga-starter-compliance.rules.json`. Not a commitment to author rules; use before funding a catalog expansion batch.

# PP-01 follow-up — ga-starter catalog extension scoping

**Audience:** Founder / principal architect deciding whether to fund full framework rule coverage in the merged file catalog.

**Status:** decision packet (2026-08-28). PP-01 theme enablement at shipped `P0` is in `master`; this gap is **orthogonal**.

## Problem statement

`BundledPolicyPackDeclarationThemeTests` measures declaration themes through the production path:

`Bundled JSON` → `complianceRuleKeys` + `priorityFloor` → merged catalog (`default-compliance.rules.json` + `ga-starter-compliance.rules.json`, **795** rules) → `DeclarationSignalPolicyKeyMap` → declaration engines.

**Gap 2 (measured):** `ga-starter-compliance.rules.json` carries only **~10 rules per framework** (`soc2`, `cis-az`, `gdpr`, `hipaa`, `iso27001`, `pci`, `zta`, `aks`). Result:

- **18 of 28** declared keys in **18** bundled packs resolve to **nothing** at any floor.
- Mapped ids such as `soc2-018`, `cis-az-012/018/019/025/027`, `hipaa-017/022/024`, `iso27001-025`, `aks-015/021` can **never fire** until catalog rows exist with real `appliesToCategory` / `requiredNodeType` / `requiredEdgeType`.

HIPAA, ISO 27001, and Zero Trust stay declaration-silent at **any** floor until this gap closes or packs stop advertising those keys.

## What PP-01 already fixed (do not re-do)

| Mechanism | Fix |
| --- | --- |
| Priority floor hiding `P0` controls | Mapped `P0`-tier rule ids (`sec-base-006`, `aks`/`eks`/`gke-002/003`) so shipped floors emit real declaration rows |
| Prefix-family false enablement | Rejected — vocabulary only, never theme enablement |
| `pack.curatedRules.v1` embed | Rejected — replaces file rules with non-evaluable `TenantCurated` rows |

## Extension options (owner pick one)

### Option A — Full framework coverage (largest)

**Work:** Author ~**144** additional `ga-starter` rules with production-grade `appliesToCategory`, node/edge requirements, and priorities aligned to each bundled pack's `*-rules-v1.json` narrative.

| Dimension | Assessment |
| --- | --- |
| Security | Low risk if rules are faithful; high reputational risk if stubs emit false positives |
| Scalability | One-time catalog cost; runtime filter cost unchanged |
| Reliability | Changes `ComplianceFindingEngine` output for every tenant assigned those packs |
| Cost | Largest engineering + review batch; ongoing corpus maintenance |

**When to choose:** Buyer pilots require HIPAA / ISO / Zero Trust declaration rows on real graphs, not demo honesty at SOC 2 / CIS / K8s baselines.

### Option B — Targeted framework slices (recommended pilot)

**Work:** Extend catalog only for **one** buyer-facing framework (e.g. SOC 2 + CIS Azure to `P1` parity, or HIPAA clinical boundary controls) — ~15–25 rules with golden fixtures per id.

| Dimension | Assessment |
| --- | --- |
| Security | Scoped blast radius; easier to review |
| Scalability | Repeat per framework when GTM demands |
| Reliability | Incremental finding emission changes |
| Cost | One Cursor/Opus batch per framework + golden tests |

**When to choose:** Next pilot names a single framework; avoid boiling the ocean.

### Option C — Honesty-only (no catalog work)

**Work:** GTM/docs state which packs move declaration rows at `P0` vs `P1`; remove or relabel bundled keys that cannot fire.

| Dimension | Assessment |
| --- | --- |
| Security | No new false findings |
| Scalability | N/A |
| Reliability | No engine output change |
| Cost | Docs + possibly trim `complianceRuleKeys` in bundled JSON |

**When to choose:** Pilots use Security Baseline + K8s baselines only; HIPAA/ISO/ZTA not in first reviews.

## Engineering guardrails (any option)

1. **No `pack.curatedRules.v1` embed** in bundled packs — see PP-01 measurement notes.
2. **No prefix-family theme enablement** — `DeclarationSignalPolicyKeyMap` stays id-specific.
3. **Single DDL file** discipline does not apply; compliance catalog is JSON — keep `ga-starter-compliance.rules.json` as the single extension file.
4. **Golden guards:** extend `BundledPolicyPackDeclarationThemeTests` + `PolicyFilteredDeclarationGoldenCorpusTests`; do not switch `GoldenCorpusHarness` to `IEffectiveGovernanceLoader` (WK-22).
5. **Run corset** after changes — `BundledPolicyPackDeclarationThemeTests` is `Suite=Core`.

## Suggested decision questions

1. Which bundled pack will the **next paid pilot** assign — SOC 2, CIS Azure, HIPAA, or K8s baseline only?
2. Is **`priorityFloor: P1`** acceptable for declaration-heavy demos (assessment open decision A4)?
3. Is **Option B** (one framework slice) sufficient for the next 90 days?

## Related

- [`policy-filter-golden-delta.md`](policy-filter-golden-delta.md) § Bundled-pack declaration coverage (PP-01)
- [`WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md`](../architecture/WEAKNESS_REMEDIATION_COMPOSER_PROMPTS.md) PP-01 follow-up
- [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](../go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md) — `-DeclarationPriorityFloor P1` for SOC 2 vs CIS Azure
