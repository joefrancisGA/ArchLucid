> **Scope:** Contributor-reference — optional specialty accelerator acceptance criteria after Core Pilot.

# Specialty accelerator acceptance criteria (V1)

**Optional after Core Pilot.** These walkthroughs do not replace [`FIRST_PILOT_OPERATOR_PATH.md`](../../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

| Accelerator | Minimum evidence | Expected artifacts | Sponsor-safe caveats | Non-goals |
| --- | --- | --- | --- | --- |
| [Azure SaaS readiness](AZURE_SAAS_READINESS_REVIEW.md) | Azure extractor Tier 1 ZIP or labeled demo workspace | Committed manifest, WAF/SaaS findings, policy pack when used | Demo-derived ROI must stay labeled | Not Azure certification or pen-test attestation |
| [AI governance](AI_GOVERNANCE_REVIEW.md) | Policy pack + committed review | Governance dry-run output when enabled, sponsor export | Simulator vs real LLM must match proof labels | Not statutory AI compliance certification |
| [Healthcare claims pilot](POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md) | Healthcare policy pack + PHI-safe demo seed | Findings with evidence refs, sponsor packet | Demo PHI storyline only — not production PHI proof | Not HIPAA certification |

Verification: `python scripts/ci/check_accelerator_handoff_docs.py` (links, V1.1 connector wording).
