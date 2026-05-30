> **Scope:** One-page production-like first-pilot preflight. Use this before sponsor handoff; route to existing docs for details.

# First-Pilot Production-Like Preflight

**Inputs:** one configured ArchLucid host, SQL-backed storage, chosen auth mode, chosen agent execution mode, and a target proof-packet run or readiness-only check.

**Outputs:** a simple **READY / WARN / HOLD** view before the first sponsor packet leaves the team.

**Boundary:** this is not a second pilot checklist. Run the operational path in [`FIRST_PILOT_OPERATOR_PATH.md`](FIRST_PILOT_OPERATOR_PATH.md); use this page only to decide whether production-like setup is safe enough for sponsor handoff.

## Preflight Rows

| Area | READY | WARN | HOLD | Source |
| --- | --- | --- | --- | --- |
| SQL and migrations | `ConnectionStrings:ArchLucid` is set; migrations applied; health is ready. | SQL is reachable but backup/DR evidence is not collected. | SQL missing, migrations fail, or health is not ready. | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md), [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) |
| Auth mode | `ArchLucidAuth:Mode` is explicit; no dev bypass in production-like host. | OIDC/SAML details need reviewer confirmation. | Auth loops, bypass flags, or missing authority/audience for bearer mode. | [`GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md), [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) |
| Agent execution mode | `AgentExecution:Mode` is intentionally `Real` or `Simulator`, and the proof packet labels it. | Simulator is acceptable for an internal dry run only. | Mode is unclear or sponsor-facing packet hides simulator/fallback/mixed evidence. | [`AI_EVIDENCE_APPENDIX.md`](../go-to-market/AI_EVIDENCE_APPENDIX.md), [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) |
| Azure OpenAI when real | Endpoint, deployment, and credential path are configured without checked-in secrets. | Real evidence is topology-only or not a full cohort; disclose limits. | Real mode requested but Azure OpenAI config or credentials are absent. | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md), [`REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](../quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) |
| Azure AI Search | Production-like profile uses `Retrieval:VectorIndex=AzureSearch` with endpoint configured. | Development uses `InMemory` and is clearly labeled non-production-like. | Production-like profile uses `InMemory` or has missing Search endpoint. | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md), [`IAC_RUNTIME_PARITY.md`](../library/IAC_RUNTIME_PARITY.md) |
| PilotStrict quality gate | PilotStrict is configured with required floors, and rejected traces block sponsor-safe completion. | Warn-only mode is used for internal dry run. | Sponsor handoff proceeds after PilotStrict reject or missing faithfulness floor. | [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md), [`QUALITY_GATE_REJECTION.md`](QUALITY_GATE_REJECTION.md) |
| Content safety and prompt hygiene | safety precheck and redaction posture are enabled for real/sponsor flows. | local simulator uses deterministic fixtures. | raw secrets, prompt bodies, or unsupported customer data enter artifacts. | [`SECURITY.md`](../library/contributor-reference/SECURITY.md), [`WHAT_NOT_TO_PROMISE.md`](../go-to-market/WHAT_NOT_TO_PROMISE.md) |
| Telemetry/export | OTLP, Application Insights, or equivalent export is configured when required. | local proof has logs only. | production-like handoff has no way to correlate failures. | [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md), [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) |
| Proof packet | `collect-first-pilot-proof.ps1` or `archlucid pilot proof-packet <runId>` produces a packet with disposition, ROI source labels, and caveats. | readiness-only run has no committed review yet. | missing ROI source, skipped real evidence, or failed PilotStrict renders as READY. | [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](FIRST_PILOT_EVIDENCE_BUNDLE.md), [`QUOTE_TO_PROOF_READINESS_CHECKLIST.md`](../go-to-market/QUOTE_TO_PROOF_READINESS_CHECKLIST.md) |

## Command Path

```powershell
archlucid config lint --profile production-like-hosted-pilot --json-out config-lint-production-like-hosted-pilot.json --markdown-out config-lint-production-like-hosted-pilot.md
.\scripts\collect-first-pilot-proof.ps1 -ProductionLikeHostedPilot -SponsorHandoff
```

Use the first command for configuration triage and the second command for buyer-safe packet evidence. A **HOLD** anywhere in sponsor handoff blocks external circulation until the blocker is fixed or explicitly recorded as deferred scope.

## Not Required For First-Pilot Success

SOC 2 CPA attestation, third-party pen-test publication, live Stripe/Marketplace commerce, MCP, public plugin ecosystem, and first-party Jira/ServiceNow/Confluence/Slack/Teams connectors are **not** first-pilot requirements. Record them as deferred or procurement-realism items when buyers ask; do not turn them into V1 sponsor-packet blockers.
