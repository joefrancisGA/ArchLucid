> **Reviewed:** 2026-07-23
> **Scope:** Pack-tree chooser for starter proof packs (CI-checked). Help/docs twin: [`DEMO_QUICKSTART.md#accelerator-chooser`](../../docs/go-to-market/DEMO_QUICKSTART.md#accelerator-chooser) (`ACCELERATOR_CHOOSER.md` alias).

# Starter proof pack chooser

Pick **one** existing pack after Core Pilot first value (finalized architecture package). Do not read every folder README first.

| Buyer job | Pack folder | Required inputs | Expected proof outputs | When **not** to use |
| --- | --- | --- | --- | --- |
| Regulated SaaS procurement / SOC-style diligence language | [`regulated-saas-soc-procurement/`](regulated-saas-soc-procurement/) | `second-run.json`, `policy-context.json` | Policy-pack findings, proof checklist, sponsor-safe caveats (no certification claims) | First session before any commit; buyer demands CPA SOC 2 report |
| Healthcare data workflow / PHI storyline | [`healthcare-data-workflow/`](healthcare-data-workflow/) | `second-run.json`, `policy-context.json` | Healthcare pack findings, checklist | Real PHI in inputs; HIPAA certification claims |
| Azure cost / orphan / governance review | [`azure-cost-governance/`](azure-cost-governance/) | `second-run.json`, optional extractor ZIP | Cost/orphan-oriented findings, ROI source labels | Non-Azure-only architecture with no Azure evidence |
| AWS cost / orphan / governance review | [`aws-cost-governance/`](aws-cost-governance/) | `second-run.json`, optional extractor ZIP | Cost/orphan-oriented findings, ROI source labels | Non-AWS-only architecture with no AWS evidence |
| GCP cost / orphan / governance review | [`gcp-cost-governance/`](gcp-cost-governance/) | `second-run.json`, optional extractor ZIP | Cost/orphan-oriented findings, ROI source labels | Non-GCP-only architecture with no GCP evidence |
| AI / LLM workload governance | [`ai-llm-workload/`](ai-llm-workload/) | `second-run.json`, `policy-context.json` | AI governance pack findings, faithfulness-friendly citations | Buyer only wants generic chat — use differentiation proof instead |

Each pack includes `starter-pack.json` metadata (`scopeLabel`, `deferredScopeNotes`, `doNotUseWhen`).

**Canonical first path:** [`docs/CORE_PILOT.md`](../../docs/CORE_PILOT.md) · [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../../docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md)

**Golden walkthrough (one pack):** [`DEMO_QUICKSTART.md#golden-accelerator-walkthrough-regulated-saas`](../../docs/go-to-market/DEMO_QUICKSTART.md#golden-accelerator-walkthrough-regulated-saas) (`GOLDEN_ACCELERATOR_WALKTHROUGH.md` alias)

**Out of scope for all V1-ready packs:** live Stripe/Marketplace checkout, CPA SOC 2, public reference customers, MCP, first-party Jira/ServiceNow/Teams/Slack connectors (V1.1 unless separately promoted).
