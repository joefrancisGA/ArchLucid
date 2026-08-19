> **Scope:** Authoring prompts for ArchLucid curated policy pack rule corpora. Internal use only. Do not paste this folder into buyer-facing materials.

# Policy pack authoring prompts

**Purpose:** Reproducible, high-quality LLM-assisted authoring of `*-rules-v1.json` curated-rules files for all 15 queued V1 packs (ARC-AMPE + 14 new additions).

---

## Files

| File | What it contains |
|------|-----------------|
| `GENERATOR_PROMPT.md` | The full prompt to paste into Cursor to generate a rules JSON file for one pack |
| `CRITIC_PROMPT.md` | The full prompt to paste into Cursor to QA/critic the generated output |
| `PACK_CONTEXTS.md` | One context block per pack — copy into the generator and critic prompts before running |

---

## Do you need a frontier model?

**Short answer: no for generation, marginally for critic, and the prompts are designed to close the gap.**

| Pass | Cursor / Sonnet | Frontier model |
|------|----------------|----------------|
| Generate rule narratives | Excellent with good prompts | Marginal improvement |
| Detect thin descriptions / missing remediation | Good (critic prompt checklist) | Slight edge |
| Detect hallucinated control IDs (e.g. wrong NIST 800-53 family) | Partial — explicit checklist helps | Better training coverage |
| Detect wrong OWASP chapter numbers | Partial | Better |
| Human spot-check (5 min/pack) | Replaces frontier model for citations | — |

**Recommendation:** Use Cursor for all passes. Spend the 5-minute human spot-check specifically on `frameworkMappings` citation accuracy — that is the only failure mode where frontier-model training coverage meaningfully exceeds a rigorous Cursor critic pass.

---

## How to use

### Step 1 — Pick the pack

Choose the pack from `PACK_CONTEXTS.md`. Packs are ordered by execution wave; complete Wave 0 (ARC-AMPE) before starting Wave 1.

### Step 2 — Generate

1. Open a **new Cursor chat**.
2. Copy the full contents of `GENERATOR_PROMPT.md`.
3. Replace the `### Pack context — FILL IN BEFORE RUNNING` block at the bottom with the relevant block from `PACK_CONTEXTS.md`.
4. Send the prompt. Cursor will output raw JSON.
5. Save the output to `docs/samples/policy-packs/<slug>-rules-v1.json`.

> **Tip:** If the output is truncated (Cursor output limits), ask "continue from where you left off" and append the continuation to the JSON rules array.

### Step 3 — Critic

1. Open a **new Cursor chat** (or the same chat; a fresh context reduces hallucination drift).
2. Copy the full contents of `CRITIC_PROMPT.md`.
3. Fill in the `### Pack context` block with the same pack's values from `PACK_CONTEXTS.md`.
4. Paste the generated JSON below the prompt.
5. Review the critic output. Fix every flagged issue in the JSON.

### Step 4 — Human spot-check (5 minutes)

Specifically verify:
- Every `frameworkMappings` entry that cites a control ID (e.g. `SC-8`, `V2.1.1`, `CIS 1.1.x`) — confirm the citation is real, not invented.
- Every `frameworkMappings.framework` string contains a version or date.
- Every `description` ends with "Thematic mapping only — not certification." if a regulatory framework is cited.
- `priority` distribution roughly follows the target in the pack context (20% P0, 50% P1, 30% P2 as a starting guide).

### Step 5 — Commit and regenerate

After the human spot-check:

1. Confirm the content-document file exists (or generate it from the template in the pack context).
2. Add the pack descriptor to `scripts/generate_v1_bundled_policy_packs.py` PACKS list with `"existing_rules": True`.
3. Run: `python scripts/generate_v1_bundled_policy_packs.py`
4. Confirm manifest entry count increments by 1.
5. Run tests: `dotnet test ArchLucid.Decisioning.Tests/...` and fix any count assertions.

---

## Quality bar (what "done" means for a pack)

| Criterion | Check |
|-----------|-------|
| ≥ 70% of target rule count shipped | Counted |
| All sub-corpora represented | At least one rule per prefix |
| Every rule has P0/P1/P2 + severity | No blanks |
| Every rule has ≥ 1 evidence hint | Critic checklist A7 |
| Disclaimer entry in every frameworkMappings | Critic checklist A9 |
| No invented control IDs | Human spot-check |
| Tests green | CI |

---

## Execution order

| Wave | Packs | Notes |
|------|-------|-------|
| 0 | ARC-AMPE (#24) | Spec complete; unblock first |
| 1 | Azure Storage (#25), Defender (#26), Sentinel (#27) | Azure-native; large buyer demand |
| 2 | Azure Policy (#29), RBAC Architecture (#30), AVD (#36) | Azure platform depth |
| 3 | Purview (#28), Power Platform (#31), Power BI/Fabric (#32) | Productivity + data governance |
| 4 | OWASP ASVS (#33), GitHub Engineering Posture (#37) | AppSec + DevSecOps |
| 5 | MITA (#35), Snowflake (#34), Azure Monitor (#38) | Vertical-specialist + cross-cloud + platform ops |

---

## Related documents

| Doc | Purpose |
|-----|---------|
| [`DEFAULT_POLICY_PACKS_V1.md`](../../go-to-market/DEFAULT_POLICY_PACKS_V1.md) | V1 GA pack list (target: 38 packs) |
| [`POLICY_PACK_CONTENT_BACKLOG.md`](../POLICY_PACK_CONTENT_BACKLOG.md) | Authoring pipeline and status |
| [`POLICY_PACK_RULE_PRIORITY_MODEL.md`](../POLICY_PACK_RULE_PRIORITY_MODEL.md) | P0/P1/P2 semantics |
| [`POLICY_PACK_ARC_AMPE_DESIGN.md`](../POLICY_PACK_ARC_AMPE_DESIGN.md) | Design spec precedent for all new packs |
| `scripts/generate_v1_bundled_policy_packs.py` | Sync samples → Bundled/ → manifest → GA stubs |
