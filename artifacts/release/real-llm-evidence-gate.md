# Real LLM evidence gate (generated)

Generated (UTC): **2026-06-25T14:25:14.6152080Z**

**Overall disposition:** `PASS`

Template: [docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md](../docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md)

Buyer index: [docs/go-to-market/AI_EVIDENCE_APPENDIX.md](../docs/go-to-market/AI_EVIDENCE_APPENDIX.md)

| Profile metrics JSON | Path |
| --- | --- |
| Topology smoke | `artifacts/release/real-llm-topology-metrics.json` |
| Full pipeline | `artifacts/release/real-llm-full-pipeline-metrics.json` |

| Check | Result | Detail |
| --- | --- | --- |
| Credentials present | **Passed** | ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY are set (values not logged) |
| Topology smoke run executed | **Passed** | dotnet test exit 0 |
| Topology smoke metrics captured | **Passed** | profile=topology-only deployment=gpt-4o |
| Topology smoke parse failures | **Passed** | parseFailures=0 (attempts=1) |
| Topology smoke evidence refs | **Passed** | evidenceRefsObserved=true |
| Topology smoke token/cost | **Not captured** | Provider returned zero token usage |
| Topology smoke structural smoke | **Passed** | topology-only: substance=9 claims=0 findings=1 topologyItems=8 |
| Topology smoke trace persistence | **Not captured** | Gate uses in-memory trace recorder only |
| Full pipeline run executed | **Passed** | dotnet test exit 0 |
| Full pipeline metrics captured | **Passed** | profile=full-pipeline deployment=gpt-4o |
| Full pipeline parse failures | **Passed** | parseFailures=0 (attempts=3) |
| Full pipeline evidence refs | **Passed** | evidenceRefsObserved=true |
| Full pipeline token/cost | **Not captured** | Provider returned zero token usage |
| Full pipeline merge completeness | **Passed** | services=2 decisionTraces=27 claims=7 |
| Full pipeline trace persistence | **Not captured** | Gate uses in-memory trace recorder only |
| Semantic score | **Not captured** | Reference evaluation / golden cohort scoring not wired for this gate |



## Legend



- **Passed** â€” positive signal for the row.

- **Failed** â€” failing assertion, merge/schema failure, or non-zero test exit when a live run was attempted.

- **Skipped** â€” prerequisite missing (typically credentials); not an execution failure.

- **Not captured** â€” no data for this dimension on this machine, or durable/host-only evidence.



## What each profile proves



- **Topology smoke** â€” Azure OpenAI completion path, JSON parsing, and evidence-reference emission for one Topology agent. Does **not** prove full multi-agent merge or sponsor-safe manifest completeness.

- **Full pipeline** â€” Topology + Compliance + Cost + Critic execution with decision merge, manifest service count, and decision count. Required before claiming full real-LLM validation.



`SKIPPED_NO_CREDENTIALS` is **not** a pass. Do not cite this gate as live validation unless disposition is `PASS` with both profiles captured.
