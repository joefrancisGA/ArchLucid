# Starter proof pack chooser

Pick **one** existing pack after Core Pilot first value (committed review). Do not read every folder README first.

| Buyer job | Pack folder | Required inputs | Expected proof outputs | When **not** to use |
| --- | --- | --- | --- | --- |
| Regulated SaaS procurement / SOC-style diligence language | [`regulated-saas-soc-procurement/`](regulated-saas-soc-procurement/) | `second-run.json`, `policy-context.json` | Policy-pack findings, proof checklist, sponsor-safe caveats (no certification claims) | First session before any commit; buyer demands CPA SOC 2 report |
| Healthcare data workflow / PHI storyline | [`healthcare-data-workflow/`](healthcare-data-workflow/) | `second-run.json`, `policy-context.json` | Healthcare pack findings, checklist | Real PHI in inputs; HIPAA certification claims |
| Azure cost / orphan / governance review | [`azure-cost-governance/`](azure-cost-governance/) | `second-run.json`, optional extractor ZIP | Cost/orphan-oriented findings, ROI source labels | Non-Azure-only architecture with no Azure evidence |
| AI / LLM workload governance | [`ai-llm-workload/`](ai-llm-workload/) | `second-run.json`, `policy-context.json` | AI governance pack findings, faithfulness-friendly citations | Buyer only wants generic chat — use differentiation proof instead |

Each pack includes `starter-pack.json` metadata (`scopeLabel`, `deferredScopeNotes`, `doNotUseWhen`).

**Canonical first path:** [`docs/CORE_PILOT.md`](../../docs/CORE_PILOT.md) · [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](../../docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md)

**Golden walkthrough (one pack):** [`docs/library/walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md`](../../docs/library/walkthroughs/GOLDEN_ACCELERATOR_WALKTHROUGH.md)

**Out of scope for all V1-ready packs:** live Stripe/Marketplace checkout, CPA SOC 2, public reference customers, MCP, first-party Jira/ServiceNow/Teams/Slack connectors (V1.1 unless separately promoted).
