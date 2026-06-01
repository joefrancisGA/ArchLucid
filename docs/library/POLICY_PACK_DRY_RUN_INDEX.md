> **Scope:** Operator/evaluator index for `templates/policy-packs/*` vertical templates.
> **Generated from:** `packManifest` in each `policy-pack.json`. **Do not edit by hand** — run
> `python scripts/ci/generate_policy_pack_dry_run_index.py --write`.

# Policy pack dry-run index (TB-176)

Maps buyer jobs to **vertical policy-pack templates** (distinct from the 23+ **bundled default**
platform packs seeded at tenant provision). Use governance **policy-pack dry-run** in the operator
shell after assigning a pack; outputs are architecture-review evidence, **not certification**.

| Pack ID | Buyer job | Target persona | Required inputs | Expected outputs | Scope | Do not use when |
| --- | --- | --- | --- | --- | --- | --- |
| [`ai-llm`](../../templates/policy-packs/ai-llm/) | Responsible AI, RAG grounding, and model-risk review for Azure LLM workloads | AI governance or ML platform lead | Policy pack enabled on scope; Architecture request describing models, RAG, and tool-calling boundaries; Redacted prompts only in pilots | Advisory findings on aillm-ctrl-* compliance rules; Grounding and human-oversight gaps in committed review | V1-ready | Buyer expects model safety certification or production legal clearance; No generative AI or LLM components in architecture scope |
| [`financial-services`](../../templates/policy-packs/financial-services/) | GLBA privacy and SOX IT general controls review on material Azure systems | Financial services security or risk lead | Policy pack enabled on scope; Architecture request with material-system boundaries and logging evidence | Advisory findings on fs-ctrl-* compliance rules; Audit-friendly governance dry-run notes when simulated | V1-ready | Buyer requires auditor-signed SOX or GLBA attestation from ArchLucid; Non-financial workload with no material-system narrative |
| [`healthcare`](../../templates/policy-packs/healthcare/) | HIPAA-oriented safeguard review on Azure health workloads | Healthcare platform or compliance lead | Policy pack enabled on scope; Architecture request describing PHI flows and encryption boundaries; Synthetic or redacted evidence only in pilots | Advisory findings on hc-ctrl-* rules (minimum necessary, audit, encryption); Proof checklist alignment when paired with healthcare starter pack | V1-ready | Real PHI in prompts or uploads without contractual basis; Buyer expects HIPAA certification or BAAs from ArchLucid |
| [`public-sector`](../../templates/policy-packs/public-sector/) | GDPR Art. 32 security and DPIA-driven proportionality on Azure agency workloads | EU agency platform or DPO-aligned architect | Policy pack enabled on scope; Architecture request with data categories and residency narrative | Advisory findings on ps-ctrl-* compliance rules; Proportionality and logging gaps surfaced in review | V1-ready | Buyer requires formal GDPR compliance certification; US FedRAMP-only scope without EU data processing |
| [`public-sector-us`](../../templates/policy-packs/public-sector-us/) | FedRAMP Moderate / NIST 800-53 control themes on Azure landing zones | US agency cloud architect or ISSO-aligned lead | Policy pack enabled on scope; Architecture request with boundary, logging, and IAM evidence | Advisory findings on psus-ctrl-* compliance rules; Control-gap narrative suitable for internal ATO prep (not ATO itself) | V1-ready | Buyer requires issued FedRAMP ATO or agency authorization package from ArchLucid; Non-US public-sector scope without 800-53 mapping need |
| [`retail`](../../templates/policy-packs/retail/) | PCI-DSS segmentation and tokenization review for retail Azure workloads | Retail payments or platform security lead | Policy pack enabled on scope; Architecture request showing CDE boundaries and payment flows | Advisory findings on rtl-ctrl-* compliance rules; CDE boundary warnings in committed review output | V1-ready | Buyer requires QSA-signed PCI ROC from ArchLucid; No payment or cardholder data in scope |
| [`saas`](../../templates/policy-packs/saas/) | SOC-style logical access and change-management review on Azure SaaS | SaaS security or platform engineering lead | Policy pack enabled on tenant/workspace/project scope; Architecture request with Azure topology and identity evidence; Optional committed run for governance dry-run simulation | Advisory findings mapped to saas-ctrl-* compliance rules; Governance dry-run delta summary when simulated against a run | V1-ready | Buyer requires CPA-issued SOC 2 Type I/II attestation; No Azure or identity evidence in the architecture request |
| [`togaf-adm-gates`](../../templates/policy-packs/togaf-adm-gates/) | TOGAF ADM phase gate and migration contract review | Enterprise architect or EA practice lead | Policy pack enabled on scope; Architecture request with phase, capability, and migration narrative | Advisory findings on ADM gate compliance rule keys; Gap notes between baseline and target architecture states | V1-ready | Buyer expects Open Group TOGAF certification or EA maturity audit; No ADM phase or migration story in the request |

## Buyer-safe caveats (all packs)

- **ai-llm:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: RAG corpus scope not bounded to tenant data (aillm-ctrl-003).
- **financial-services:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: material system without segregated logging retention (fs-ctrl-004).
- **healthcare:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: PHI store without encryption-at-rest evidence (hc-ctrl-003).
- **public-sector:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: cross-border transfer without documented safeguards (ps-ctrl-005).
- **public-sector-us:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: audit logging not centralized for security boundary (psus-ctrl-004).
- **retail:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: CDE subnet shares resources with non-CDE tier (rtl-ctrl-002).
- **saas:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: privileged access paths without PIM or break-glass controls (saas-ctrl-001).
- **togaf-adm-gates:** Architecture-review input only — not certification and not legal advice. Sample: Example warning: migration contract missing rollback criteria (togaf-adm-f-migration-contract).

## Related surfaces

- Starter proof packs (ZIP evidence path): [`ACCELERATOR_CHOOSER.md`](ACCELERATOR_CHOOSER.md)
- Bundled default packs (tenant seed): [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)
- Metadata contract: [`POLICY_PACK_METADATA_CONTRACT.md`](POLICY_PACK_METADATA_CONTRACT.md)
- First-pilot governance proof: [`../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md`](../runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md)

