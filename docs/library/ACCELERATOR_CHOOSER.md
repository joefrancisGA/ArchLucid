> **Scope:** Buyer-job → starter proof pack map for evaluators after Core Pilot first commit. Not a certification catalog.

# Accelerator chooser

Use this table **after** your first committed review ([Core Pilot](CORE_PILOT.md)). It maps a buyer job to an **existing** starter proof pack under `templates/starter-proof-packs/` — no new templates required.

| Buyer job | Starter pack | Target persona | Required inputs | Expected proof outputs | Scope | When **not** to use |
| --- | --- | --- | --- | --- | --- | --- |
| Regulated SaaS procurement / SOC-style diligence language | [`regulated-saas-soc-procurement`](../../templates/starter-proof-packs/regulated-saas-soc-procurement/) | Security / procurement lead | `second-run.json`, `policy-context.json` | Policy-pack findings, proof checklist, sponsor-safe caveats (not CPA SOC 2) | **V1-ready** | Before any commit; buyer demands CPA attestation |
| Healthcare data workflow / PHI storyline | [`healthcare-data-workflow`](../../templates/starter-proof-packs/healthcare-data-workflow/) | Clinical platform or compliance lead | `second-run.json`, `policy-context.json` | Healthcare pack findings, checklist | **V1-ready** | Real PHI in inputs; HIPAA certification claims |
| Azure cost / orphan / governance review | [`azure-cost-governance`](../../templates/starter-proof-packs/azure-cost-governance/) | FinOps or platform owner | `second-run.json`, optional extractor ZIP | Cost/orphan-oriented findings, ROI source labels | **V1-ready** | Non-Azure-only architecture with no Azure evidence |
| AI / LLM workload governance | [`ai-llm-workload`](../../templates/starter-proof-packs/ai-llm-workload/) | AI governance or platform lead | `second-run.json`, `policy-context.json` | AI governance findings, faithfulness-friendly citations | **V1-ready** | Generic chat comparison only; no LLM in scope |
| Multi-tier web architecture (greenfield) | Wizard preset **Greenfield web app** (in-app) | Engineering lead / architect | Architecture request via new-review wizard | Topology/compliance findings on your inputs | **V1-ready** | Buyer needs specialty pack above instead |

Each pack folder includes `starter-pack.json` with `scopeLabel`, `doNotUseWhen`, and `deferredScopeNotes`.

## How to start in the operator shell

1. Confirm Core Pilot commit exists (golden manifest on a run).
2. Pick one row from the table.
3. Open **New review** with baseline ZIP intake (`/reviews/new?baseline=1`) when the pack lists `second-run.json`, or use **Quick review** / **Detailed wizard** for greenfield presets.
4. Attach pack JSON/ZIP from the pack folder as evidence; run the pipeline; commit; export the proof checklist in the pack folder.

## Policy packs (governance templates)

Vertical **policy-pack** templates (assign in governance, dry-run in operator shell) are indexed separately from starter proof ZIP packs:

- [`POLICY_PACK_DRY_RUN_INDEX.md`](POLICY_PACK_DRY_RUN_INDEX.md) — buyer job → pack ID, inputs, caveats (TB-176)
- Metadata contract: [`POLICY_PACK_METADATA_CONTRACT.md`](POLICY_PACK_METADATA_CONTRACT.md)

Bundled **platform default** packs (23+ categories seeded per tenant) are listed in [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md).

## Canonical references

- Pack chooser (templates tree): [`templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md`](../../templates/starter-proof-packs/STARTER_PROOF_PACK_CHOOSER.md)
- Golden walkthrough (one pack): [`walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md`](walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md)
- First-pilot path: [`../runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md)

**Out of scope for all V1-ready packs:** live Stripe/Marketplace checkout, CPA SOC 2, public reference customers, MCP, first-party Jira/ServiceNow/Teams/Slack connectors (V1.1 unless separately promoted).
