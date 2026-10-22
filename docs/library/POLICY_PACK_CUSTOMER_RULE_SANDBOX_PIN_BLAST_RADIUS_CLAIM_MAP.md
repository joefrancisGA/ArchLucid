> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Policy packs — customer rule sandbox, manifest pin, blast radius

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** Shipped contract for **TB-1624** / GTM **M-298**. Honesty CI **TB-1625** / **M-298** (`check_policy_pack_customer_rule_sandbox_honesty.py`).

**Verdict (one line):** Customer-authored rules are **declarative data** interpreted by a **bounded in-process criteria/action engine** — **not** a WASM/script sandbox — pinned at commit via **`PolicyPackVersion` + `RuleSetHash` + `EffectiveGovernanceAtCommit`**; a broken or “malicious” pack degrades **that tenant’s** reviews (noise, wrong gates), **not** other tenants’ data plane or platform code execution.

---

## 1. What “sandboxes” rule execution

| Layer | What it is | What it is not |
|-------|------------|----------------|
| Pack / curated rule JSON (`pack.curatedRules.v1`, compliance rule packs) | Versioned **data plane** | Arbitrary code / plugins |
| `TenantCuratedComplianceRulePackMerger` | Merge curated entries into file pack | Remote code load |
| `DecisionRuleCriteriaEvaluator` / `RuleBasedDecisionEngine` | **Bounded** field-path + string-match criteria → compiled action semantics | Turing-complete DSL / `eval` |
| Typed `IFindingEngine`s | Compiled finding producers | Per-customer engine upload |
| `ComplianceRulePackValidator` | Structural checks (ids, duplicates) | Semantic security / resource sandbox |
| Process / container | Shared API/Worker process | Per-rule WASM, Firecracker, or job isolation |
| Agent tool allowlists (**TB-082** adjacent) | Agent surface — **different plane** | Does **not** sandbox policy-pack JSON |

**Extensibility honesty:** In-tenant `PublishVersion` / SemVer + OrganizationPrivate distribution exists; commissioned custom packs are also a **professional-services** SKU — not a claim of unconstrained programmable policy language (**TB-1324** / **M-235**).

---

## 2. How rule versions pin into committed manifests

| Pin surface | When | Contents |
|-------------|------|----------|
| `PolicyPackAssignment.PolicyPackVersion` | Assignment / resolve | Exact version string (not SemVer range) |
| `PolicyPackResolver` / `EffectiveGovernanceResolver` | Execute / resolve | Loads that exact `PolicyPackVersion` |
| `CommittedEffectiveGovernanceSnapshotCapturer` | **Commit** | `EffectiveGovernanceAtCommit.PackAssignments[]` with `PolicyPackId` + `PolicyPackVersion` + scope |
| Golden manifest `RuleSetId` / `RuleSetVersion` / `RuleSetHash` | Commit / persist | Decision rule-set identity hash for replay/export |
| `ComplianceRuleKeys` on commit snapshot | Commit | Effective key list frozen with conflicts count |

**Gap (documented, not hidden):** Draft/execute before commit has **no** separate durable per-run pack-version column outside resolver — pin is **commit-time** on the golden manifest (see architecture quality assessment §A.5). Later assignment changes do **not** rewrite sealed commits.

**PlatformDefault:** HTTP rejects customer `PublishVersion` on platform-default packs — content lock, not “cannot unassign.”

---

## 3. What stops a broken / malicious rule from degrading reviews platform-wide

| Threat | Mitigation today | Residual |
|--------|------------------|----------|
| Cross-tenant data / pack bleed | Tenant-scoped packs + assignment `TenantId` checks; OrganizationPrivate blocks marketplace/cross-tenant distribution | Shared process resources (below) |
| RCE / arbitrary code via pack JSON | No script host — declarative criteria only | If a future Turing DSL ships, this map is void |
| Corrupt other tenants’ packs | Tenant repository scope + distribution rules | Admin/platform ops mistakes outside product path |
| Degrade **all** tenants’ review quality | **No** — bad rules apply only where assigned | Authoring tenant (and scopes) **can** self-degrade |
| Self-degrade (noise, false Critical, bad BlockCommit) | Dry-run / simulate APIs; optional pre-commit gate is assignment-scoped; unassign / republish | Quality risk is **tenant-local governance**, not platform integrity |
| Shared-process DoS (huge rule lists / hot path) | Soft — evaluation is O(rules×findings) string work, not unbounded script | No per-tenant CPU quota on pack eval; pathological content can slow a shared replica |
| Change sealed history | Commit snapshot + `RuleSetHash` immutability of golden row | Re-run/replay can pick **new** effective set |

**“Platform-wide” ≠ “that tenant’s reviews.”** Sales must not equate tenant-local bad packs with multi-tenant outage or code compromise.

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Rules run in a WASM / secure sandbox” | Bounded declarative interpreter in-process |
| “Customer packs are a programmable policy language” | Versioned data + compiled interpreter (**TB-1324**) |
| “Broken packs cannot affect reviews” | They **can** affect the **authoring tenant’s** scopes |
| “Malicious pack takes down the platform / other tenants’ data” | Tenant-scoped; no RCE path via pack JSON |
| “Execute-time always durable-pins pack versions” | **Commit-time** pin on golden manifest |
| “PlatformDefault content is editable by customers” | Republish locked; selection/assignment still operator-controlled |
| Conflate with agent tool sandbox (**TB-082**) | Different plane |

---

## 5. Related owners (orchestrate — do not duplicate)

| ID | Role |
|----|------|
| Open **TB-1324**–**TB-1325**, **M-235**/**M-236** | Evaluation hybrid (data plane vs compiled) + anti-Turing-DSL |
| Done **TB-1022**, open **TB-1023**, **M-172**/**M-173** | Pre-finalize gate vs advisory / pack≠cert |
| Open **G-CONTENT-01** | Bundled pack content enrichment |
| Done multi-cloud pack content **TB-701**–**TB-719** | Do not reopen |
| Done **TB-1624** / **M-298**; Done **TB-1625** honesty CI | This sandbox / pin / blast-radius claim map + language guards |

## 7. CI anchors (**TB-1625**)

Honesty guard: `scripts/ci/check_policy_pack_customer_rule_sandbox_honesty.py` (wired in `run_buyer_surface_strict_guards.py`).

Fails buyer-doc stubs that claim WASM/Firecracker/per-rule process sandbox, pack JSON as RCE/scripting, “broken packs cannot affect reviews,” platform-wide/cross-tenant pack outage, or execute-time durable pack-version pin. Source of truth: this map + `CommittedEffectiveGovernanceSnapshotCapturer` / `DecisionRuleCriteriaEvaluator` / **TB-1324**.

---

## 6. Optional follow-ons (not required to close honesty pin)

- Per-tenant CPU/time budget on compliance evaluation under shared CA.
- Durable execute-time pack-version provenance before commit.
- Stronger publish-time schema / semantic validation beyond id uniqueness.
