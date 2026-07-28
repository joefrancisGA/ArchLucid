> **Scope:** Canonical redirect map for the documentation audit â€” former paths, where content lives now, and why the old file was removed. Use this instead of keeping redirect stub markdown files in the tree; update inbound links to the **canonical** column when you touch a caller.

> **Spine doc:** [`START_HERE.md`](START_HERE.md).

# Documentation redirects

**Last reviewed:** 2026-07-24

Human readers and agents should follow **canonical** paths below. This file is the only redirect surface â€” do not recreate thin "moved" stub files.

## How to use

| Situation | Action |
|-----------|--------|
| You have a bookmark or external link to a **former** path | Look up the row; open **canonical** instead |
| You are editing markdown that links to a former path | Change the link to **canonical** |
| Terraform / CI / UI embeds a doc path by string | Prefer **canonical**; if the string is load-bearing, update the embed in the same change |
| A former path is not listed | Add a row when you delete or merge a doc during the audit |

---

## 2026-07-24 documentation merge clusters

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/go-to-market/EVIDENCE_LINKED_DIFFERENTIATION_PACKET.md` | [`docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md#evidence-linked-comparison) | Evidence-linked comparison folded into proof packet |
| `docs/go-to-market/CLAIM_READINESS_CHECKLIST.md` | [`docs/go-to-market/CLAIM_READINESS_STATUS.md`](go-to-market/CLAIM_READINESS_STATUS.md#appendix-gate-passhold-criteria) | Gate criteria, session record, and stage exits are appendices |
| `docs/go-to-market/PROCUREMENT_FAST_LANE.md` | [`docs/go-to-market/PROCUREMENT_PACK_INDEX.md`](go-to-market/PROCUREMENT_PACK_INDEX.md#fast-lane-starter) | Fast-lane starter table merged into canonical pack index |
| `docs/go-to-market/PROCUREMENT_EVIDENCE_PACK_INDEX.md` | [`docs/go-to-market/PROCUREMENT_PACK_INDEX.md`](go-to-market/PROCUREMENT_PACK_INDEX.md) | Navigation-only index merged into canonical pack index |
| `docs/onboarding/EVALUATION_GUIDE.md` | [`docs/onboarding/EVALUATOR_WORKBOOK.md`](onboarding/EVALUATOR_WORKBOOK.md) | Evaluator depth appendix |
| `docs/library/V1_CRITICAL_PATH_MAP.md` | [`docs/runbooks/ROLE_INDEX.md`](runbooks/ROLE_INDEX.md#v1-critical-path-mandatory-docs) | Mandatory V1 paths merged into role index |
| `docs/go-to-market/QUOTE_TO_PROOF_READINESS_CHECKLIST.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-checklist) | Readiness checklist merged into quote-to-proof packet |
| `docs/go-to-market/QUOTE_TO_PILOT_PACK.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#pre-pilot-quote-pack) | Pre-pilot quote pack merged into quote-to-proof packet |
| `docs/go-to-market/PROCUREMENT_EVIDENCE_PACKET.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-routing-map) | Procurement routing folded into buyer security packet |
| `docs/go-to-market/DIFFERENTIATOR_EVIDENCE_MATRIX.md` | [`docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md#deal-cycle-heuristic-matrix) | Buyer-heuristic matrix + deal-cycle steps folded into proof packet |
| `docs/go-to-market/SECURITY_REVIEWER_ISOLATION_ONE_PAGER.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#isolation-one-pager-m-114) | M-114 isolation handout folded into buyer security packet |
| `docs/go-to-market/COMPETITOR_CONTRAST.md` | [`docs/go-to-market/COMPETITIVE_POSITIONING.md`](go-to-market/COMPETITIVE_POSITIONING.md#narrative-competitor-contrasts) | Honest win/lose narratives folded into competitive positioning |
| `docs/go-to-market/COMPETITIVE_COMPARISON.md` (body) | [`docs/go-to-market/COMPETITIVE_LANDSCAPE.md`](go-to-market/COMPETITIVE_LANDSCAPE.md#procurement-facing-category-comparison) | Procurement category comparison folded into competitive landscape; filename kept as path-stable pack alias |
| `docs/go-to-market/SECURITY_CONTROL_EVIDENCE_MAP.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#control-to-evidence-map) | Control-to-evidence table folded into buyer security packet (via former security reviewer one-pager) |
| `docs/go-to-market/SECURITY_REVIEWER_ONE_PAGER.md` (body) | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#security-reviewer-one-pager) | Security reviewer one-pager folded into buyer security packet; filename kept as path-stable pack alias |
| `docs/go-to-market/DESIGN_PARTNER_RECRUITING_PIPELINE.md` | [`docs/go-to-market/BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md#pilot-recruiting-pipeline) | TB-161 subset twin; recruiting pipeline lives in buyer personas |
| `docs/go-to-market/PILOT_RECRUITING_PIPELINE.md` (body) | [`docs/go-to-market/BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md#pilot-recruiting-pipeline) | Recruiting TAP/BANT/intake folded into buyer personas; filename kept as path-stable alias |
| `docs/go-to-market/PILOT_SUPPORT_OPERATING_MODEL.md` | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#v1-pilot-operating-model) | TB-162 subset twin; white-glove vs self-serve modes folded into support policy |
| `docs/go-to-market/SUPPORT_AND_PILOT_OPERATING_MODEL.md` | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#v1-pilot-operating-model) | Pilot operating model folded into support policy |
| `docs/go-to-market/CUSTOMER_HEALTH_SCORING.md` | [`docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`](go-to-market/PILOT_SUCCESS_SCORECARD.md#1-customer-health-scoring) | Health scoring folded into pilot success scorecard (via former renewal playbook) |
| `docs/go-to-market/RENEWAL_EXPANSION_PLAYBOOK.md` (body) | [`docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`](go-to-market/PILOT_SUCCESS_SCORECARD.md#renewal-and-expansion-playbook) | Renewal/expansion playbook folded into pilot success scorecard; filename kept as path-stable alias |
| `docs/go-to-market/PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md` | [`docs/archive/gtm-internal/PMF_VALIDATION_TRACKER.md`](archive/gtm-internal/PMF_VALIDATION_TRACKER.md#21a-buyer-safe-evidence-row-template) | Buyer-safe evidence row folded into PMF tracker |
| `docs/go-to-market/FIRST_SESSION_DISMISSAL_PLAYBOOK.md` | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#3-session-dismissal-cohort-founder-operations) | Dismissal cohort ops folded into first-session observation |
| `docs/go-to-market/SPONSOR_EXPORT_DISCOVERY_TEST.md` | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#sponsor-export-discovery-test-focused-micro-test) | Export discovery micro-test folded into first-session observation |
| `docs/go-to-market/DECISION_DELTA_INTERVIEW.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#decision-delta-interview-paid-pilots) | Decision-delta interview folded into quote-to-proof (via former paid-pilot ledger) |
| `docs/go-to-market/validation/PILOT_ROI_VALIDATION_SESSION.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#pilot-roi-validation-session) | 15-minute ROI validation session folded into quote-to-proof (via former paid-pilot ledger) |
| `docs/go-to-market/validation/PAID_PILOT_EVIDENCE_LEDGER.md` (body) | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#paid-pilot-evidence-ledger) | Paid-pilot evidence ledger folded into quote-to-proof; filename kept as path-stable CLI/UI alias |
| `docs/go-to-market/LINKEDIN_PUBLISHING_SCHEDULE.md` | [`docs/go-to-market/LINKEDIN_CONTENT_V1.md`](go-to-market/LINKEDIN_CONTENT_V1.md#publishing-schedule-m-10m-15) | V1 LinkedIn calendar folded into content hub |
| `docs/go-to-market/SEO_AND_PAID_ACQUISITION.md` (body) | [`docs/library/PUBLIC_MARKETING_SITE_TOPOLOGY.md`](library/PUBLIC_MARKETING_SITE_TOPOLOGY.md#seo-and-paid-web-acquisition) | SEO + paid acquisition folded into public marketing topology; filename kept as path-stable alias |
| `docs/go-to-market/PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md` | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#dismissal-interview-script-head-to-head) | Head-to-head dismissal interview folded into first-session observation (via former dismissal log) |
| `docs/go-to-market/validation/PRINCIPAL_ARCHITECT_DISMISSAL_LOG.md` (body) | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-dismissal-log) | Dismissal log + interview folded into first-session observation; filename kept as path-stable CLI / M-44 alias |
| `docs/go-to-market/PRINCIPAL_ARCHITECT_FALSIFICATION_SCRIPT.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#principal-architect-falsification-script-m-113) | PA falsification script folded into buyer security packet |
| `docs/go-to-market/CREATE_REVIEW_POSITIONING_ADVERSARIAL_EVALUATION.md` | [`docs/go-to-market/POSITIONING.md`](go-to-market/POSITIONING.md#create-vs-review--adversarial-evaluation-closed) | Closed create/review evaluation folded into positioning |
| `docs/go-to-market/DECISION_CYCLE_TELEMETRY.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#6-decision-cycle-telemetry-local-learning) | Decision-cycle telemetry folded into quote-to-proof (via former conversion checklist) |
| `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist) | Commercial conversion checklist folded into quote-to-proof packet |
| `docs/go-to-market/OPERATIONAL_TRANSPARENCY.md` | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#8-operational-transparency--status-page-plan) | Status-page plan folded into support policy (via former incident communications) |
| `docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md` (body) | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#incident-communications-and-status-page) | Incident communications folded into support policy; filename kept as path-stable deal-ready alias |
| `docs/go-to-market/AZURE_EXTRACTOR_INFOSEC_PREREAD.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-extractor--infosec-pre-read) | Azure extractor InfoSec pre-read folded into buyer security packet |
| `docs/go-to-market/COST_GUIDE.md` | [`docs/go-to-market/ROI_MODEL.md`](go-to-market/ROI_MODEL.md#operational-cost-guide-azure--llm) | Ops cost guide folded into ROI model |
| `docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md` (body) | [`docs/go-to-market/ROI_MODEL.md`](go-to-market/ROI_MODEL.md#aggregate-roi-bulletin-template) | Aggregate ROI bulletin template folded into ROI model; filename kept as path-stable CLI/CI alias |
| `docs/go-to-market/STEERING_DECISION_MEMO_TEMPLATE.md` | [`docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`](go-to-market/PILOT_SUCCESS_SCORECARD.md#8-steering-decision-memo-template) | Steering/ARB memo template folded into pilot success scorecard |
| `docs/go-to-market/PROCUREMENT_DEAL_READY_ONE_PAGER.md` | [`docs/go-to-market/PROCUREMENT_PACK_INDEX.md`](go-to-market/PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager) | Deal-ready one-pager folded into procurement pack index |
| `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_SESSION_SCORECARD.md` | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#session-scorecard) | PA session scorecard folded into first-session observation (via former insight validation protocol) |
| `docs/go-to-market/Architect_Evaluation/PRINCIPAL_ARCHITECT_INSIGHT_VALIDATION_PROTOCOL.md` (body) | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-insight-validation) | Insight validation / blind cohort / scorecard folded into first-session observation; filename kept as path-stable CLI / blind-validation alias |
| `docs/go-to-market/validation-runs/BLIND_DECISION_DELTA_COHORT_TRACKER.md` (body) | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-decision-delta-cohort-tracker) | Blind decision-delta cohort tracker folded into first-session observation; filename kept as path-stable M-50 alias |
| `docs/go-to-market/validation-runs/README.md` (body) | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#validation-runs-folder) | Validation-runs folder landing folded into first-session observation; filename kept as path-stable folder alias |
| `docs/go-to-market/Architect_Evaluation/Packets/README.md` (body) | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#principal-architect-evaluation-packet-set) | PA evaluation packet-set index folded into first-session observation; filename kept as path-stable alias beside packets |
| `docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md` | [`docs/go-to-market/PROCUREMENT_PACK_INDEX.md`](go-to-market/PROCUREMENT_PACK_INDEX.md#how-to-request-and-build-the-pack) | Pack request/build runbook folded into procurement pack index |
| `docs/go-to-market/AI_EVIDENCE_APPENDIX.md` | [`docs/go-to-market/AI_READINESS_POSTURE.md`](go-to-market/AI_READINESS_POSTURE.md#buyer-safe-evidence-inventory) | Buyer-safe AI evidence appendix folded into AI readiness posture |
| `docs/go-to-market/AI_OUTPUT_DECISION_SUPPORT.md` (body) | [`docs/go-to-market/AI_READINESS_POSTURE.md`](go-to-market/AI_READINESS_POSTURE.md#ai-output-is-decision-support) | AI decision-support limits folded into AI readiness posture; filename kept as path-stable pack alias |
| `docs/go-to-market/SIEM_EXPORT.md` (body) | [`docs/library/SIEM_EXPORT.md`](library/SIEM_EXPORT.md) | Buyer SIEM summary twin folded into library SIEM guide; filename kept as path-stable pack alias |
| `docs/go-to-market/validation/DECISION_CHANGE_ADDENDUM.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#decision-change-addendum) | Decision-change addendum folded into quote-to-proof (via former paid-pilot ledger) |
| `docs/go-to-market/LEGAL_PROCUREMENT_TERMS_PACKET.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#legal-and-procurement-terms) | Legal/procurement terms packet folded into quote-to-proof (via former transactable path) |
| `docs/go-to-market/TRANSACTABLE_PROCUREMENT_PATH.md` (body) | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#transactable-procurement-path) | Transactable procurement path folded into quote-to-proof; filename kept as path-stable alias |
| `docs/go-to-market/SYNTHETIC_CASE_STUDY_CONTOSO_RETAIL.md` | [`docs/go-to-market/ROI_MODEL.md`](go-to-market/ROI_MODEL.md#synthetic-contoso-retail-case-study) | Synthetic Contoso Retail case study folded into ROI model |
| `docs/go-to-market/WHAT_NOT_TO_PROMISE.md` | [`docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) | GTM do-not-promise table folded into public claim boundary guide |
| `docs/go-to-market/REVIEW_CADENCE.md` | [`docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md`](go-to-market/ASSURANCE_STATUS_CANONICAL.md#procurement-documentation-review-cadence) | Procurement review cadence folded into assurance status canonical |
| `docs/go-to-market/WELCOME_HERO_CTA_ANALYTICS.md` | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#welcome-hero--ctas-analytics-and-compliance) | Welcome hero CTA/Clarity/compliance folded into demo quickstart (via former DEMO_WORKSPACES) |
| `docs/go-to-market/PROOF_LANGUAGE_CLAIM_AUDIT.md` | [`docs/go-to-market/CLAIM_READINESS_STATUS.md`](go-to-market/CLAIM_READINESS_STATUS.md#proof-language-claim-audit-static-buyer-docs) | Proof-language claim audit folded into claim readiness (via former sponsor claim label audit) |
| `docs/go-to-market/SPONSOR_CLAIM_LABEL_AUDIT.md` (body) | [`docs/go-to-market/CLAIM_READINESS_STATUS.md`](go-to-market/CLAIM_READINESS_STATUS.md#sponsor-claim-and-execution-mode-label-audit) | Sponsor claim label audit folded into claim readiness; filename kept as path-stable CI alias |
| `docs/go-to-market/DEEPER_RAG_QUALITY_PROGRAM.md` | [`docs/go-to-market/AI_READINESS_POSTURE.md`](go-to-market/AI_READINESS_POSTURE.md#deeper-rag-quality-program) | Deeper RAG quality program folded into AI readiness posture |
| `docs/go-to-market/CROSS_TENANT_DATA_PROCESSING_ADDENDUM.md` | [`docs/go-to-market/DPA_TEMPLATE.md`](go-to-market/DPA_TEMPLATE.md#10-cross-tenant-patterns-opt-in) | Cross-tenant operational addendum folded into DPA Â§10 |
| `docs/go-to-market/BACKUP_AND_DR.md` | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#9-backup-disaster-recovery-and-data-lifecycle) | Backup/DR/lifecycle folded into support policy (via former SLA summary) |
| `docs/library/SLA_TARGETS.md` (body) | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#hosted-saas-availability-target) | Hosted SaaS availability target folded into support policy; filename kept as path-stable alias |
| `docs/go-to-market/SLA_SUMMARY.md` (body) | [`docs/go-to-market/SUPPORT_POLICY.md`](go-to-market/SUPPORT_POLICY.md#service-level-objectives) | Buyer SLO summary folded into support policy; filename kept as path-stable deal-ready alias |
| `docs/library/PILOT_ROI_MODEL.md` (body) | [`docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`](go-to-market/PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement) | Pilot ROI measurement folded into success scorecard; filename kept as path-stable alias |
| `docs/go-to-market/OWNER_SECURITY_ASSESSMENT_REDACTED_FOR_PACK.md` (body) | [`docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md`](go-to-market/ASSURANCE_STATUS_CANONICAL.md#owner-security-assessment-procurement-excerpt) | Owner security procurement excerpt folded into assurance canonical; filename kept as path-stable pack alias |
| `docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md` | [`docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`](go-to-market/PILOT_SUCCESS_SCORECARD.md#customer-onboarding-operating-playbook) | Customer onboarding playbook folded into pilot success scorecard |
| `docs/go-to-market/WORKED_EXAMPLE_ROI.md` | [`docs/go-to-market/ROI_MODEL.md`](go-to-market/ROI_MODEL.md#worked-example-roi-contoso-sample) | Contoso worked-example ROI MD mirror folded into ROI model (PDF path unchanged) |
| `docs/go-to-market/PROCUREMENT_FAQ.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq) | Enterprise procurement FAQ folded into buyer security packet (`/help/procurement`) |
| `docs/go-to-market/SOC2_ROADMAP.md` | [`docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md`](go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) | SOC 2 readiness roadmap folded into assurance status canonical |
| `docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md` (body) | [`docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md`](go-to-market/ASSURANCE_STATUS_CANONICAL.md#current-assurance-posture-evidence) | Evidence snapshot folded into assurance canonical; filename kept as path-stable pack alias |
| `docs/go-to-market/TENANT_ISOLATION.md` (body) | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview) | Buyer isolation overview folded into buyer security packet; filename kept as path-stable pack alias |
| `docs/go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md` (body) | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-response-accelerator) | SIG/CAIQ accelerator folded into buyer security packet; filename kept as path-stable alias |
| `docs/go-to-market/MODEL_SEATS_COUNTER_POSITIONING_TEST.md` | [`docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md#model-seats-counter-positioning-message-test) | Model-seats message test folded into differentiation proof packet |
| `docs/go-to-market/ADMIN_SURFACE_FIRST_60S_AUDIT.md` | [`archlucid-ui/docs/NAV_CONFIG_CONTRACT.md`](../archlucid-ui/docs/NAV_CONFIG_CONTRACT.md) | Point-in-time first-60s admin leakage audit; living contract is nav tests + NAV_CONFIG_CONTRACT |
| `docs/go-to-market/BUSINESS_VALUE_CHEAT_SHEET.md` | [`docs/go-to-market/POSITIONING.md`](go-to-market/POSITIONING.md#product-datasheet) | Orphan featureâ†’outcome table; buyer capability claims live in positioning datasheet section |
| `docs/go-to-market/PRODUCT_DATASHEET.md` (body) | [`docs/go-to-market/POSITIONING.md`](go-to-market/POSITIONING.md#product-datasheet) | Datasheet body folded into positioning; filename kept as path-stable alias |
| `docs/go-to-market/V1_1_PUBLIC_REFERENCE_CUSTOMER_CHECKLIST.md` | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#named-reference-customer-capture) | Empty V1.1 stub; capture + publication checklists live in the reference-customers index |
| `docs/go-to-market/M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md` | [`docs/archive/gtm-internal/M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md`](archive/gtm-internal/M06_WORKSPACE_B_LANDING_CLAIM_REVIEW.md) | Closed M-06 / G-REAL-04 claim review archived from live GTM |
| `docs/go-to-market/PLACEHOLDER_AUDIT.md` | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md) | TB-230 human checklist retired; live SoT is `scripts/ci/check_gtm_placeholder_tokens.py` |
| `docs/go-to-market/SECURITY_AUDIT_WALKTHROUGH.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#example-audit-walkthrough-one-finalized-review) | Seven-step audit path folded into buyer security packet (via former security reviewer one-pager) |
| `docs/go-to-market/reference-customers/DESIGN_PARTNER_NEXT_CASE_STUDY.md` | [`docs/go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md`](go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md) | Duplicate placeholder scaffold; copy EXAMPLE to `<slug>_CASE_STUDY.md` for the next partner |
| `docs/go-to-market/reference-customers/TRIAL_FIRST_REFERENCE_CASE_STUDY.md` (body) | [`docs/go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md`](go-to-market/reference-customers/EXAMPLE_DESIGN_PARTNER_CASE_STUDY.md#plg-first-paying-tenant-variant) | PLG first-paying-tenant case study folded into design-partner example; filename kept as path-stable alias |
| `docs/go-to-market/COMMERCIAL_DECISION_PACKET.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#founder-led-offer-menu-after-first-credible-review) | Founder-led offer menu + pilot deliverables folded into quote-to-proof |
| `docs/go-to-market/AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#readiness-review-engagement-pack-tb-133) | TB-133 Readiness Review pack folded into quote-to-proof (via former service-led offers) |
| `docs/go-to-market/SERVICE_LED_OFFERS.md` (body) | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#productized-service-offers) | Productized SKUs / SOW folded into quote-to-proof; filename kept as path-stable CI alias |
| `docs/go-to-market/TRIAL_BASELINE_PRIVACY_NOTE.md` | [`docs/go-to-market/TRIAL_AND_SIGNUP.md`](go-to-market/TRIAL_AND_SIGNUP.md#baseline-review-cycle-privacy) | Baseline field privacy note folded into trial/signup design |
| `docs/go-to-market/NOT_A_FIT.md` | [`docs/go-to-market/BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md#when-archlucid-is-not-a-fit) | Blunt not-a-fit filter folded into buyer personas |
| `docs/go-to-market/SHOULD_YOU_EVALUATE.md` | [`docs/go-to-market/BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md#should-you-evaluate) | Buyer self-routing folded into buyer personas |
| `docs/go-to-market/IDEAL_CUSTOMER_PROFILE.md` | [`docs/go-to-market/BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md#ideal-customer-profile-icp) | ICP firmographics + scoring matrix folded into buyer personas |
| `docs/go-to-market/DEMO_VIDEO_STORYBOARD.md` | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#two-minute--under-3-minute-video-storyboard) | Shot table + pre/post checklists folded into demo quickstart (via former demo video script) |
| `docs/go-to-market/DEMO_VIDEO_SCRIPT.md` | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#demo-scripts) | Live-call scripts + video storyboard folded into demo quickstart |
| `docs/go-to-market/EXECUTIVE_ONE_EMAIL_KIT.md` | [`docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md#12-one-email-sponsor--procurement-kit) | One-email copy blocks folded into sponsor brief |
| `docs/go-to-market/reference-customers/PUBLICATION_CHECKLIST.md` | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#0-publication-checklist-human-gates) | Human publish gates folded into reference-customers index (via former publication runbook) |
| `docs/go-to-market/reference-customers/REFERENCE_EVIDENCE_PACK_DEMO_SCAFFOLD.md` | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#demo-tenant-scaffold-internal-shape-only) | Demo shape mapping folded into reference-customers index |
| `docs/go-to-market/reference-customers/REFERENCE_EVIDENCE_PACK_TEMPLATE.md` (body) | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#reference-evidence-pack-template) | Evidence pack template folded into reference-customers index; filename kept as path-stable alias |
| `docs/go-to-market/reference-customers/REFERENCE_PUBLICATION_RUNBOOK.md` (body) | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#reference-publication-runbook) | Publication runbook folded into reference-customers index; filename kept as path-stable CI alias |
| `docs/go-to-market/DECISION_FAST_LANE.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#0-pilot-vs-procurement-fast-lane) | Pilot vs procurement calendars folded into quote-to-proof (via former transactable path) |
| `docs/go-to-market/BUYER_JOURNEY.md` | [`docs/go-to-market/BUYER_PERSONAS.md`](go-to-market/BUYER_PERSONAS.md#buyer-journey-field-motion) | Outside-in journey folded into buyer personas |
| `docs/go-to-market/CONTROLLED_PILOT_OBJECTION_DRILL.md` | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#controlled-pilot-drill) | Rehearsal drill folded into buyer security packet (via former objection playbook) |
| `docs/go-to-market/PROCUREMENT_OBJECTION_PLAYBOOK.md` (body) | [`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`](go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#procurement-objection-playbook) | Objection playbook folded into buyer security packet; filename kept as path-stable CI alias |
| `docs/go-to-market/M18_OUTREACH_MESSAGE_TEMPLATE.md` | [`docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md#m-18-outreach-message-templates) | Warm outreach templates folded into sponsor brief elevator section |
| `docs/go-to-market/ELEVATOR_PITCH.md` | [`docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md`](go-to-market/EXECUTIVE_SPONSOR_BRIEF.md#elevator-pitches) | Elevator scripts + M-18 outreach folded into sponsor brief |
| `docs/go-to-market/ARCHITECTURE_REVIEW_BOARD_EXPORT.md` | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#architecture-review-board-export) | ARB export how-to folded into demo quickstart (via former samples README) |
| `docs/go-to-market/samples/README.md` (body) | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#gtm-samples) | GTM samples index folded into demo quickstart; filename kept as path-stable alias beside binaries |
| `docs/go-to-market/SCREENSHOT_GALLERY.md` | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#screenshot-capture-brief) | Screenshot capture brief folded into demo quickstart |
| `docs/go-to-market/UI_GLOSSARY_V1.md` | [`docs/library/CONCEPT_VOCABULARY.md`](library/CONCEPT_VOCABULARY.md#ui-glossary-v1) | Buyer UI glossary + persona terms folded into concept vocabulary |
| `docs/go-to-market/validation/FRONTIER_AI_COUNTERFACTUAL_CADENCE.md` | [`docs/go-to-market/FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md`](go-to-market/FRONTIER_AI_COUNTERFACTUAL_SCOREBOARD.md#maintenance-cadence) | Cadence + claim rules folded into scoreboard |
| `docs/go-to-market/PAID_SERVICE_LED_REVIEW_OFFER_TEST.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#paid-offer-test-private) | Private paid offer test folded into quote-to-proof (via former service-led offers) |
| `docs/go-to-market/SERVICE_LED_SOW_QUOTE_TEMPLATE.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template) | Private SOW template folded into quote-to-proof (via former service-led offers) |
| `docs/go-to-market/PROOF_PACKET_RUN_LOG_OPERATING_CHECKLIST.md` | [`docs/go-to-market/CLAIM_READINESS_STATUS.md`](go-to-market/CLAIM_READINESS_STATUS.md#operating-checklist) | Operating checklist folded into claim readiness (via former run log) |
| `docs/go-to-market/PROOF_PACKET_RUN_LOG.md` | [`docs/go-to-market/CLAIM_READINESS_STATUS.md`](go-to-market/CLAIM_READINESS_STATUS.md#proof-packet-run-log) | G4 proof-packet run log folded into claim readiness status |
| `docs/go-to-market/SECOND_REVIEW_HABIT_LOOP_EXECUTION_BOARD.md` | [`docs/library/REPEAT_REVIEW_LOOP.md`](library/REPEAT_REVIEW_LOOP.md#6-week-execution-board) | 6-week board folded into repeat-review cookbook (via former habit-loop validation) |
| `docs/go-to-market/SECOND_REVIEW_HABIT_LOOP_VALIDATION.md` (body) | [`docs/library/REPEAT_REVIEW_LOOP.md`](library/REPEAT_REVIEW_LOOP.md#second-review-habit-loop-validation) | Habit-loop validation folded into repeat-review cookbook; filename kept as path-stable alias |
| `docs/go-to-market/CONNECTOR_PULL_FORWARD_DECISION.md` | [`docs/go-to-market/GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md#closed-hold-decisions-owner) | Closed HOLD decision archived in GTM backlog |
| `docs/go-to-market/POLICY_PACK_BREADTH_DECISION.md` | [`docs/go-to-market/GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md#closed-hold-decisions-owner) | Closed HOLD decision archived in GTM backlog |
| `docs/go-to-market/POLICY_TO_DECISION_PROOF_PILOT_RUNSHEET.md` | [`docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md`](go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md#policy-to-decision-proof-pilot-run-sheet) | Pilot run-sheet folded into policy-pack delta demo script |
| `docs/go-to-market/FRONTIER_AI_BAKEOFF_EVIDENCE_PACK.md` | [`docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md#evidence-pack-checklist) | Evidence pack checklist/templates folded into differentiation proof packet (via former bakeoff protocol) |
| `docs/go-to-market/GENERIC_AI_BAKEOFF_PROTOCOL.md` (body) | [`docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md`](go-to-market/DIFFERENTIATION_PROOF_PACKET.md#generic-ai-bakeoff-protocol) | Generic-AI bakeoff protocol folded into differentiation proof packet; filename kept as path-stable alias |
| `docs/go-to-market/LINKEDIN_CONTENT_V2.md` | [`docs/go-to-market/LINKEDIN_CONTENT_V1.md`](go-to-market/LINKEDIN_CONTENT_V1.md#builder-series-m-77m-88) | Builder-series articles folded into LinkedIn content hub |
| `docs/go-to-market/Architect_Evaluation/BLIND_INSIGHT_VALIDATION_PROTOCOL.md` | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-insight-validation) | Blind protocol folded into first-session observation (via former insight validation protocol) |
| `docs/go-to-market/Architect_Evaluation/BLIND_PRINCIPAL_ARCHITECT_VALIDATION_COHORT.md` | [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md#blind-cohort-operating-checklist) | Cohort checklist folded into first-session observation (via former insight validation protocol) |
| `docs/go-to-market/BUYER_BASELINE_CAPTURE_CHECKLIST.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#pre-pilot-baseline-capture-operator-checklist) | Kickoff baseline checklist folded into quote-to-proof (via former ROI SEND policy) |
| `docs/go-to-market/ROI_BASELINE_SEND_POLICY.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy) | ROI baseline SEND policy folded into quote-to-proof packet |
| `docs/go-to-market/EXECUTIVE_PAID_PILOT_PROOF_PACKET.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#executive-paid-pilot-proof-packet-assembly--mock-procurement-review) | Six-element assembly + mock review folded into quote-to-proof |
| `docs/go-to-market/DEFAULT_POLICY_PACK_CALIBRATION.md` | [`docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`](go-to-market/DEFAULT_POLICY_PACKS_V1.md#6-operator-calibration) | Operator calibration folded into default policy packs catalog |
| `docs/go-to-market/SPONSOR_PACKET_SEND_NO_SEND_HARDENING_REVIEW.md` | [`docs/go-to-market/CLAIM_READINESS_STATUS.md`](go-to-market/CLAIM_READINESS_STATUS.md#appendix--sendno-send-hardening-review-2026-06-16) | 2026-06-16 hardening review folded into claim readiness (via former sponsor claim label audit) |
| `docs/go-to-market/demo-proof-packets/ai-governance-demo-proof.md` | [`docs/library/walkthroughs/AI_GOVERNANCE_REVIEW.md`](library/walkthroughs/AI_GOVERNANCE_REVIEW.md#demo-proof-shape-demo-derived-only) | Demo proof shape folded into AI governance walkthrough (via former buyer-job) |
| `docs/go-to-market/buyer-jobs/AI_GOVERNANCE_REVIEW.md` (body) | [`docs/library/walkthroughs/AI_GOVERNANCE_REVIEW.md`](library/walkthroughs/AI_GOVERNANCE_REVIEW.md#buyer-job-packaging) | AI governance buyer-job packaging folded into walkthrough; filename kept as path-stable Specialty alias |
| `docs/go-to-market/demo-proof-packets/azure-saas-readiness-demo-proof.md` | [`docs/library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md`](library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#demo-proof-shape-demo-derived-only) | Demo proof shape folded into Azure SaaS readiness walkthrough (via former buyer-job) |
| `docs/go-to-market/buyer-jobs/AZURE_SAAS_READINESS.md` (body) | [`docs/library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md`](library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging) | Azure SaaS buyer-job packaging folded into walkthrough; filename kept as path-stable Specialty alias |
| `docs/go-to-market/demo-proof-packets/healthcare-claims-demo-proof.md` | [`docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#demo-proof-shape-demo-derived-only) | Demo proof shape folded into healthcare claims walkthrough (via former buyer-job) |
| `docs/go-to-market/buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` (body) | [`docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging) | Healthcare claims buyer-job packaging folded into walkthrough; filename kept as path-stable Specialty alias |
| `docs/go-to-market/demo-proof-packets/first-run-demo-script.md` | [`docs/go-to-market/DEMO_QUICKSTART.md`](go-to-market/DEMO_QUICKSTART.md#first-run-demo-script-simulator) | First-run simulator script folded into demo quickstart |
| `docs/go-to-market/demo-proof-packets/README.md` | [`docs/library/walkthroughs/README.md`](library/walkthroughs/README.md#buyer-jobs-specialty-index) | Demo-proof index folded into Specialty walkthroughs index (via former buyer-jobs README) |
| `docs/go-to-market/buyer-jobs/README.md` (body) | [`docs/library/walkthroughs/README.md`](library/walkthroughs/README.md#buyer-jobs-specialty-index) | Specialty buyer-job / demo-proof index folded into walkthroughs README; filename kept as path-stable alias |
| `docs/go-to-market/BUYER_OPERATOR_PATH_CHOOSER.md` | [`docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md`](go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md#choose-your-next-step) | Next-step chooser folded into buyer orientation |
| `docs/go-to-market/REFERENCE_CUSTOMER_TRACKING_CHECKLIST.md` | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#per-customer-tracking-checklist-ah) | Tracking checklist aâ€“h folded into reference-customers index |
| `docs/go-to-market/HEALTHCARE_VERTICAL_BRIEF.md` | [`docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#healthcare-vertical-positioning-sales--architecture) | Healthcare sales/architecture brief folded into healthcare claims walkthrough (via former buyer-job) |
| `docs/go-to-market/REFERENCE_CUSTOMER_FIRST_CONTACT_TEMPLATE.md` | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#5-first-contact-email-template) | First-contact email folded into reference-customers index |
| `docs/go-to-market/NAMED_REFERENCE_CUSTOMER_CAPTURE.md` (body) | [`docs/go-to-market/reference-customers/README.md`](go-to-market/reference-customers/README.md#named-reference-customer-capture) | Named-reference capture folded into reference-customers index; filename kept as path-stable alias |

---

## 2026-07-20 audit merges (content deleted)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ONBOARDING_GOLDEN_CHANGE_PATH_2026_04_17.md` | [`docs/library/GOLDEN_CHANGE_PATH.md`](library/GOLDEN_CHANGE_PATH.md) | Engineer "extend safely" checklists |
| `docs/archive/ONBOARDING_HAPPY_PATH_2026_04_17.md` | [`docs/onboarding/day-one-developer.md`](onboarding/day-one-developer.md#following-the-request-past-create-execute--commit--retrieval--ask) | Single-request lifecycle narrative |
| `docs/archive/ONBOARDING_GOLDEN_PATH_2026_04_17.md` | [`docs/library/GOLDEN_PATH.md`](library/GOLDEN_PATH.md) | Environment maturity sequencing (Zero â†’ Azure) |
| `docs/integrations/SSO_AUTH0_CONFIGURATION.md` | [`docs/integrations/IDP_PROVISIONING.md`](integrations/IDP_PROVISIONING.md) | Auth0 SSO (Â§2) |
| `docs/integrations/SSO_OKTA_CONFIGURATION.md` | [`docs/integrations/IDP_PROVISIONING.md`](integrations/IDP_PROVISIONING.md) | Okta SSO (Â§3) |
| `docs/archive/ONBOARDING_CONTRIBUTOR_ONBOARDING_2026_04_17.md` | [`docs/onboarding/day-one-developer.md`](onboarding/day-one-developer.md) | Duplicate contributor stub â€” no unique content |
| `docs/archive/FIRST_5_DOCS.md` | [`docs/START_HERE.md`](START_HERE.md) | Legacy five-doc spine bookmark stub |
| `docs/archive/FIRST_FIVE_DOCS.md` | [`docs/START_HERE.md`](START_HERE.md) | Alternate spelling of `FIRST_5_DOCS` stub |
| `docs/READ_THIS_FIRST.md` | [`docs/START_HERE.md`](START_HERE.md) | Deprecated Y/N routing stub (2026-04-27) |
| `docs/archive/READ_THIS_FIRST.md` | [`docs/START_HERE.md`](START_HERE.md) | Archive duplicate of root decision-tree stub |
| `docs/archive/FIRST_RUN_WIZARD.md` | [`docs/library/FIRST_RUN_WIZARD.md`](library/FIRST_RUN_WIZARD.md) | Legacy wizard design-note bookmark stub |
| `docs/archive/FIRST_RUN_WALKTHROUGH.md` | [`docs/library/FIRST_RUN_WALKTHROUGH.md`](library/FIRST_RUN_WALKTHROUGH.md) | Legacy first-run walkthrough bookmark stub |
| `docs/archive/FIRST_FIVE_DOCS_SUPERSEDED_2026_04_22.md` | [`docs/START_HERE.md`](START_HERE.md) | Archived pre-spine reading-order table |
| `docs/archive/NAVIGATOR.md` | [`docs/START_HERE.md`](START_HERE.md) | Legacy task-navigator bookmark stub |
| `docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md` | [`docs/library/OBSERVABILITY.md`](library/OBSERVABILITY.md#authority-pipeline-remediation-runbook) | Authority pipeline Grafana/Prometheus remediation |
| `docs/runbooks/GRAFANA_DASHBOARD_BINDING_GUIDE.md` | [`docs/runbooks/OBSERVABILITY_DASHBOARD_BINDING.md`](runbooks/OBSERVABILITY_DASHBOARD_BINDING.md) | Grafana import / datasource binding |

---

## 2026-04-23 SaaS-framing moves (`docs/library/` â†’ `docs/engineering/`)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/library/BUILD.md` | [`docs/engineering/BUILD.md`](engineering/BUILD.md) | Build & test hygiene (contributor) |
| `docs/library/CONTAINERIZATION.md` | [`docs/engineering/CONTAINERIZATION.md`](engineering/CONTAINERIZATION.md) | Docker / compose |
| `docs/library/DEVCONTAINER.md` | [`docs/engineering/DEVCONTAINER.md`](engineering/DEVCONTAINER.md) | Dev container |
| `docs/library/DEPLOYMENT.md` | [`docs/engineering/DEPLOYMENT.md`](engineering/DEPLOYMENT.md) | Deploy & rollback umbrella |
| `docs/archive/INSTALL_ORDER.md` | [`docs/engineering/INSTALL_ORDER.md`](engineering/INSTALL_ORDER.md) | Contributor install order |
| `docs/archive/FIRST_30_MINUTES.md` | [`docs/engineering/FIRST_30_MINUTES.md`](engineering/FIRST_30_MINUTES.md) | Contributor first 30 minutes |

---

## Customer-facing body moves (`docs/library/` â†’ `docs/library/customer-facing/`)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/library/OPERATOR_QUICKSTART.md` | [`docs/library/customer-facing/OPERATOR_QUICKSTART.md`](library/customer-facing/OPERATOR_QUICKSTART.md) | Command-first operator quickstart |
| `docs/library/PILOT_GUIDE.md` | [`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md) | Pilot onboarding |

---

## Other former paths

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/TROUBLESHOOTING.md` | [`docs/runbooks/TROUBLESHOOTING.md`](runbooks/TROUBLESHOOTING.md) | Root entry stub removed |
| `docs/library/CORE_PILOT.md` | [`docs/CORE_PILOT.md`](CORE_PILOT.md) | Customer first-session guide (repo-root canonical) |
| `docs/integrations/AZURE_DEVOPS_PR_DECORATION.md` | [`docs/integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md`](integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) (pipeline) Â· [`docs/integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) (server-side) | Pick integration path |

---

## 2026-07-20 deployment doc consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#part-a--staging) | Staging post-deploy validation |
| `docs/deployment/STAGING_DEPLOYMENT_CHECKLIST.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#part-a--staging) | Staging operator checklist |
| `docs/deployment/STAGING_PRE_DEPLOY_VERIFICATION.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#a1-pre-deploy-verification-before-terraform-apply-or-cd) | Staging pre-deploy gates |
| `docs/runbooks/CANARY_DEPLOYMENT.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#part-c--canary-promotion-container-apps) | Canary / revision traffic split |
| `docs/runbooks/STAGING_TRIAL_VALIDATION_CHECKLIST.md` | [`docs/runbooks/PRODUCTION_DEPLOYMENT.md`](runbooks/PRODUCTION_DEPLOYMENT.md#a5-staging-trial-funnel-validation-pre-rc-sign-off) | Staging trial funnel pre-RC checklist (phases 1â€“7) |
| `docs/runbooks/STRIPE_OPERATOR_CHECKLIST.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#operator-completion-checklist) | Stripe Team tier operator strike list |
| `docs/runbooks/STRIPE_STAGING_E2E_VERIFICATION.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#staging-end-to-end-verification-stripe-test-mode) | Staging Stripe TEST verification + SQL |

---

## 2026-07-21 commerce doc consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md` | [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#publisher-identity--partner-center-placeholders) | Partner Center MPN / offer IDs, legal entity, landing page |
| `docs/runbooks/STRIPE_WEBHOOK_INCIDENT.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#webhook-incident-triage) | Stripe webhook incident triage, statement descriptor, signing-secret rotation |
| `docs/runbooks/MARKETPLACE_CHANGEPLAN_QUANTITY_ROLLBACK.md` | [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#marketplace-ga-rollback-changeplan--changequantity) | Marketplace `GaEnabled` rollback, SQL reconciliation, re-enable |
| `docs/go-to-market/MARKETPLACE_PUBLICATION.md` | [`docs/go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md`](go-to-market/AZURE_MARKETPLACE_SAAS_OFFER.md#publication-checklist-gtm) | Partner Center publication checklist, tier mapping, default region |
| `docs/runbooks/MARKETING_STRIPE_GA.md` | [`docs/go-to-market/STRIPE_CHECKOUT.md`](go-to-market/STRIPE_CHECKOUT.md#marketing-site--stripe-ga-public-go-live) | Marketing Front Door GA + live Stripe checkout and webhooks |

## 2026-07-21 migration doc consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/ROLLING_DEPLOY_MIGRATIONS.md` | [`docs/runbooks/MIGRATION_ROLLBACK.md`](runbooks/MIGRATION_ROLLBACK.md#rolling-deploy-migrations) | Expand/contract patterns, coordinated migrations, TB-068 CI lint |
| `docs/runbooks/SAML_CERT_ROTATION.md` | [`docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md`](runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md) | Former short alias filename; canonical SAML SP signing cert rotation |
| `docs/library/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md` | [`docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md`](runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md) | Former library pointer stub; canonical runbook under `docs/runbooks/` |
| `docs/runbooks/EMAIL_OTP_ABUSE_DRILL.md` | [`docs/runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md`](runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md#abuse-drill-evidence-e1) | Staging OTP flood drill (Evidence E1) |
| `docs/runbooks/FIRST_VALUE_20_MINUTES.md` | [`docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`](runbooks/FIRST_PILOT_OPERATOR_PATH.md#first-value-in-20-minutes-time-boxed) | Time-boxed path to sponsor-safe artifact |

## 2026-07-22 runbook consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/PRE_COMMIT_CI_GATE_STARTER.md` | [`docs/runbooks/CI_GOVERNANCE_GATE.md`](runbooks/CI_GOVERNANCE_GATE.md#minimal-ci-starters) | Minimal copy-paste simulate/commit CI starters |
| `docs/runbooks/SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md` | [`docs/runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md`](runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md#artifact-open-order) | Proof-folder artifact open order + buyer-safe table |

## 2026-07-22 archiforge / brownfield Terraform cleanup

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md` | [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) Â§3 | Pre-release greenfield only; brownfield `state mv` runbook removed |
| `docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md` | [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) Â§3 | Archived copy removed with runbook |

## 2026-07-22 CHANGE_SET series consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/CHANGE_SET_55R_SUMMARY.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | Â§55R |
| `docs/archive/CHANGE_SET_56R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | Â§56R |
| `docs/archive/CHANGE_SET_57R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | Â§57R |
| `docs/archive/CHANGE_SET_58R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | Â§58R |
| `docs/archive/CHANGE_SET_59R.md` | [`docs/archive/CHANGE_SET_SERIES_55R_59R.md`](archive/CHANGE_SET_SERIES_55R_59R.md) | Â§59R |

## 2026-07-22 marketability assessment consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M2.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Mixed framing â€” pre-M2 |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_PRE_M3.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Mixed framing â€” post-M1+M2 |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_TRUST_CENTER.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | SaaS-only â€” pre-Trust Center |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_IMP2_6.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | SaaS-only â€” post-Trust Center |
| `docs/MARKETABILITY_ASSESSMENT_2026_04_15.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Legacy root alias (mixed framing) |
| `docs/archive/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY_PRE_trust-center.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Old filename casing alias |
| `docs/archive/IMPROVEMENTS_COMPLETE_2026_04_21.md` | [`docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) | Superseded schema-validation summary; see `docs/CHANGELOG.md` for component history |
| `docs/archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md` | [`docs/library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) | April 2026 refactor snapshot removed; canonical engineering backlog |

## 2026-07-22 assessment series consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/root-superseded-2026-05-01/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | Â§Weighted assessment |
| `docs/archive/root-superseded-2026-05-01/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | Â§Cursor prompts |
| `docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | Legacy root path |
| `docs/CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_23_73_20.md` | [`docs/archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md`](archive/QUALITY_ASSESSMENT_SERIES_2026_04_23.md) | Legacy root path |
| `docs/archive/root-superseded-2026-05-01/USABILITY_SOLUTION_QUALITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | Â§Weighted assessment |
| `docs/archive/root-superseded-2026-05-01/CURSOR_PROMPTS_USABILITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | Â§Cursor prompts |
| `docs/USABILITY_SOLUTION_QUALITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | Legacy root path |
| `docs/CURSOR_PROMPTS_USABILITY_ASSESSMENT_2026_04_25_69_52.md` | [`docs/archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md`](archive/USABILITY_ASSESSMENT_SERIES_2026_04_25.md) | Legacy root path |

## Renamed (not deleted)

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ONBOARDING_PILOT_GUIDE_2026_04_17.md` | [`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md) | Former 56R local-dev pilot guide |
| `docs/archive/PILOT_GUIDE_CHANGE_SET_56R.md` | [`docs/library/customer-facing/PILOT_GUIDE.md`](library/customer-facing/PILOT_GUIDE.md) | **56R** local-dev pilot guide (canonical customer-facing guide) |

## 2026-07-22 tier-2 archive consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/PRODUCT_PACKAGING_THREE_LAYERS_2026_04_23.md` | [`docs/library/PRODUCT_PACKAGING.md`](library/PRODUCT_PACKAGING.md) | Three-layer buyer narrative superseded by Pilot + Operate |
| `docs/archive/TECH_BACKLOG_DONE_ARCHIVE.md` | [`docs/library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) | Empty stub headings removed; summary **Done** rows retained |
| `docs/archive/artifacts-phase3-2026-04-23/gate-verification.md` | [`docs/archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md`](archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md) | Â§Gate verification |
| `docs/archive/artifacts-phase3-2026-04-23/pr-a2-cohort-parity.md` | [`docs/archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md`](archive/artifacts-phase3-2026-04-23/PHASE3_EVIDENCE_SERIES_2026_04_23.md) | Â§PR A2 cohort parity |

## 2026-07-22 assessment prompt consolidation

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/assessments/ASSESSMENT_PROMPT_V3.MD` (body) | [`docs/assessments/ASSESSMENT_PROMPT_SERIES.md`](assessments/ASSESSMENT_PROMPT_SERIES.md) | Â§Strategic release and market readiness (v3); stub remains at former path |
| `docs/assessments/assessment_prompt_v4.md` (body) | [`docs/assessments/ASSESSMENT_PROMPT_SERIES.md`](assessments/ASSESSMENT_PROMPT_SERIES.md) | Â§Broader exposure readiness (v4); stub remains at former path |

## 2026-07-22 internal doc review digest

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/archive/ARCHLUCID_INTERNAL_DOC_REVIEW_AND_MASTER_SUMMARY.md` | Git history | Auto-generated inventory removed; use `docs/archive/README.md` |

## 2026-07-22 library / runbook stub sweep

| Former path | Canonical path | Notes |
|-------------|----------------|-------|
| `docs/library/FAQ.md` | [`docs/library/customer-facing/FAQ.md`](library/customer-facing/FAQ.md) | Phase 1 move stub removed |
| `docs/library/GOVERNANCE.md` | [`docs/library/contributor-reference/GOVERNANCE.md`](library/contributor-reference/GOVERNANCE.md) | Phase 1 move stub removed |
| `docs/library/CONCEPTS_IN_5_MINUTES.md` | [`docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md`](library/customer-facing/CONCEPTS_IN_5_MINUTES.md) | Phase 2 move stub removed |
| `docs/library/WORKFLOW_RECIPES_BY_PERSONA.md` | [`docs/library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md`](library/customer-facing/WORKFLOW_RECIPES_BY_PERSONA.md) | Phase 1 bookmark stub removed |
| `docs/library/CHAMPION_48H_KIT.md` | [`docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`](go-to-market/QUOTE_TO_PROOF_PACKET.md#0-pilot-vs-procurement-fast-lane) · [`docs/CORE_PILOT.md`](CORE_PILOT.md) | Legacy champion kit filename |
| `docs/runbooks/TENANT_SQL_TOPOLOGY_RUNBOOK.md` | [`docs/operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md`](operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md) | Runbook lives under `docs/operations/` |
| `docs/runbooks/CORRELATION_AND_TRACING.md` | [`docs/library/BACKGROUND_JOB_CORRELATION.md`](library/BACKGROUND_JOB_CORRELATION.md) Â· [`docs/library/OBSERVABILITY.md`](library/OBSERVABILITY.md) | Correlation + tracing entry points |
| `docs/library/SECURITY.md` | [`docs/library/contributor-reference/SECURITY.md`](library/contributor-reference/SECURITY.md) | Phase 3 move stub removed (TB-013) |
| `docs/library/COVERAGE_GAP_ANALYSIS.md` | [`docs/COVERAGE_GAP_ANALYSIS.md`](COVERAGE_GAP_ANALYSIS.md) | Stale library duplicate removed; CI generator writes root path only |
| `docs/library/API_CONTROLLER_MAP.md` | [`docs/library/CONTROLLER_AREA_MAP.md`](library/CONTROLLER_AREA_MAP.md) | Filename alias stub removed |
| `docs/library/BILLING_WEBHOOKS.md` | [`docs/library/BILLING.md`](library/BILLING.md) | Webhook routes already documented in canonical billing doc |
| `docs/engineering/CONTRIBUTOR_ON_ONE_PAGE.md` | [`docs/CONTRIBUTOR_ON_ONE_PAGE.md`](CONTRIBUTOR_ON_ONE_PAGE.md) | Duplicate of CI-guarded root one-pager |
| `docs/library/ARCHITECTURE_ON_A_PAGE.md` | [`docs/ARCHITECTURE_ON_ONE_PAGE.md`](ARCHITECTURE_ON_ONE_PAGE.md) | Self-demoted narrative duplicate of canonical C4 poster |
| `docs/library/CODE_MAP.md` | [`docs/library/CONTRIBUTOR_CODE_MAP.md`](library/CONTRIBUTOR_CODE_MAP.md) | Path table folded into contributor code map |
| `docs/library/customer-facing/CUSTOMER_GLOSSARY.md` | In-app `/help/glossary` (`archlucid-ui/src/lib/customer-glossary-manifest.ts`) | Thin stub removed â€” terms are app-rendered |
| `docs/ARCHITECTURE_INDEX.md` | [`docs/architecture/README.md`](architecture/README.md) | Thin hub superseded by architecture README |
| `docs/library/OPENAPI_CLIENT_DRIFT_OPERATOR_NOTE.md` | [`docs/library/OPENAPI_CONTRACT_DRIFT.md`](library/OPENAPI_CONTRACT_DRIFT.md) | Checklist folded into contract-drift doc |
| `docs/library/customer-facing/HOW_IT_WORKS.md` | [`docs/library/customer-facing/HOW_ARCHLUCID_WORKS.md`](library/customer-facing/HOW_ARCHLUCID_WORKS.md) Â· [`DATA_HANDLING.md`](library/customer-facing/DATA_HANDLING.md) | Maintainer split stub removed |
| `docs/library/customer-facing/OPERATOR_TROUBLESHOOTING.md` | In-app `/help/troubleshooting` (`troubleshooting-help-guide-content.ts`) | Thin stub removed â€” guide is app-rendered |
| `docs/library/MARKETING_PRODUCT_SEPARATION_TECHNICAL_BACKLOG.md` | [`docs/library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) (TB-729â€“731) | Superseded satellite removed |
| `docs/library/IA_TAXONOMY_TECHNICAL_BACKLOG.md` | [`docs/library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) (TB-732â€“737) | Superseded satellite removed |
| `docs/go-to-market/BULK_EVIDENCE_UPLOAD_V1.md` | [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md#6k-evidence-bulk-upload--limits-and-batching) | Thin orphan; GA cap/ZIP rule lives in deferred inventory |
| `docs/archive/assessments/MARKETABILITY_ASSESSMENT_2026_04_15.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Duplicate of consolidated series |
| `docs/archive/assessments/MARKETABILITY_ASSESSMENT_2026_04_15_SAAS_ONLY.md` | [`docs/archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md`](archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Duplicate of consolidated series |
| docs/go-to-market/DEMO_WORKSPACES.md (body) | [docs/go-to-market/DEMO_QUICKSTART.md](go-to-market/DEMO_QUICKSTART.md#demo-workspaces) | Demo workspaces folded into demo quickstart; filename kept as path-stable GUID CI alias |
