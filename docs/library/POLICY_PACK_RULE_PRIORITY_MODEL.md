> **Scope:** Contributor-reference — Curated policy pack rule sizing and priority tiers (P0/P1/P2) — product assumptions for authors, operators, and compliance evaluation; not legal certification guidance.

> **Spine doc:** [`POLICY_PACK_CONTENT_BACKLOG.md`](POLICY_PACK_CONTENT_BACKLOG.md) · Buyer summary: [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)

# Policy pack rule priority model

**Audience:** Engineers, content authors, and GTM explaining how ArchLucid scopes framework coverage without shipping fixed-size placeholder corpora.

---

## 1. Assumptions

| # | Assumption | Rationale |
|---|------------|-----------|
| A1 | **No fixed rule count per pack.** Each pack grows to match its source standard (e.g. CIS Azure may need 80+ architecture-review prompts; DORA may need only a handful). | A flat cap (e.g. 10 rules) misrepresents framework breadth and blocks credible enterprise narratives. |
| A2 | **`priority` is orthogonal to `severity`.** Priority = governance **coverage tier** (what the tenant chose to enforce). Severity = finding **impact** when a rule fires. | A documentation-gap rule can be `P0` + `Medium`; a missing encryption control can be `P0` + `Critical`. |
| A3 | **Three priority tiers:** `P0` (must-have), `P1` (should-have), `P2` (nice-to-have / mature posture). | Enables progressive disclosure: pilots start narrow, mature tenants widen coverage. |
| A4 | **`priorityFloor` in `advisoryDefaults`** (same pattern as `severityFloor`) gates **compliance evaluation**. Default for net-new bundled packs: **`P0`** until corpora are fully tagged; unset floor behaves as **`P2`** (include all tiers) for backward compatibility. | Operators raise the floor in pack assignment or merged defaults when ready for broader enforcement. |
| A5 | **Missing `priority` on a rule defaults to `P1`.** | Safe middle tier for legacy JSON and file-pack stubs until authors tag rows explicitly. |
| A6 | **Sub-corpora via rule id conventions** are encouraged where the framework defines tiers (e.g. `cis-az-l1-*` vs `cis-az-l2-*`, `soc2-cc-*` vs `soc2-a-*`). | Lets sellers describe “CIS L1 by default” without a second pack binary. |
| A7 | **Thematic mapping only** — packs do not imply SOC 2, HIPAA, CIS, or Microsoft **certification**. | Same buyer-safe posture as [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md). |
| A8 | **Content depth is iterative.** Starter templated rules may ship before full framework extraction; LLM generator → critic → human SME pipeline replaces placeholders ([`POLICY_PACK_CONTENT_BACKLOG.md`](POLICY_PACK_CONTENT_BACKLOG.md)). | Product ships **plumbing first**, then deepens narratives per pack without platform releases. |

---

## 2. Priority tier semantics

| Tier | Meaning | Typical volume per pack (guidance, not a cap) |
|------|---------|-----------------------------------------------|
| **P0** | Architecture should not ship without this control documented or dispositioned. | ~5–15 rules (framework-dependent) |
| **P1** | Expected for production / regulated workloads. | Often the bulk of the corpus |
| **P2** | Advanced or mature-posture checks. | As needed |

**Inclusion rule:** A pack with `priorityFloor: "P1"` evaluates all rules where `priority` is `P0` or `P1`. Floor `P0` evaluates only `P0` rules. Floor `P2` evaluates all tiers.

---

## 3. JSON schema (curated rules v1)

Each rule in `*-rules-v1.json` may include:

```json
{
  "id": "gdpr-001",
  "title": "...",
  "severity": "High",
  "priority": "P0",
  "description": "...",
  "remediationGuidance": "...",
  "evidenceHints": ["..."],
  "frameworkMappings": [{ "framework": "GDPR", "theme": "Art. 32 Security" }]
}
```

Pack content document (`*.json` without `-rules-`) may set:

```json
"advisoryDefaults": {
  "severityFloor": "warning",
  "priorityFloor": "P0",
  "scanDepth": "standard"
}
```

---

## 4. Evaluation pipeline (code)

1. Merge file-pack + curated rules (`TenantCuratedComplianceRulePackMerger`).
2. Narrow by `complianceRuleKeys` / `complianceRuleIds` (`ComplianceRulePackGovernanceFilter`).
3. Apply **`priorityFloor`** from merged `advisoryDefaults` (`PolicyPackPriorityFloor`).

---

## 5. Authoring workflow

1. Map the **source standard** to as many architecture-review rules as needed (no artificial cap).
2. Tag each rule with `priority` and `severity`.
3. Set pack `priorityFloor` for the intended pilot posture (usually `P0` at first).
4. Validate: `dotnet run --project ArchLucid.Cli -- policy validate docs/samples/policy-packs/<slug>-rules-v1.json`
5. Sync bundled content: `python scripts/generate_v1_bundled_policy_packs.py`

---

## 6. Related links

| Doc | Purpose |
|-----|---------|
| [`POLICY_PACK_CONTENT_BACKLOG.md`](POLICY_PACK_CONTENT_BACKLOG.md) | Pack list + LLM pipeline |
| [`docs/samples/policy-packs/README.md`](../samples/policy-packs/README.md) | Import / validate |
| [`contributor-reference/GOVERNANCE.md`](contributor-reference/GOVERNANCE.md) | Pack lifecycle |
