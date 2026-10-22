Here is a copy-paste implementation prompt for **assessment improvement #5 — Real-mode evidence cadence on RC cuts** (Tier 2 in `LATEST_GPT55.md`).

---

## Prompt: Implement assessment improvement #5 — Real-mode evidence cadence on RC cuts

```text
Implement assessment improvement #5 from docs/assessments/LATEST_GPT55.md §17 Tier 2:

**"Real-mode evidence cadence on RC cuts — Re-run Invoke-RealLlmEvidenceGate.ps1; attach to release bundle per G5."**

Classification: V1 ops · Design leverage 3 / Market leverage 4.
Do NOT touch backend API contracts, UI components, or governance logic. This is an operational evidence-refresh task.

---

## Goal (one sentence)

Re-run the real-mode LLM evidence gate against the current codebase using Azure OpenAI, commit the updated evidence artifacts, and update the G5 claim readiness date to prove the release candidate maintains real-mode AI quality.

---

## Product intent

The assessment notes that our "Real-mode evidence cadence on RC cuts" is a gap. Because we shipped improvements #1 through #4 today (including the Phase B faithfulness gate which directly impacts LLM evaluation), we need to prove that the new codebase still passes the G5 live AI evidence gate. This proves our "Frontier-AI Survival Probability" and "Correctness & Evidence Integrity" by showing that the actual LLM integration still works end-to-end.

---

## Steps to execute

### A. Run the real-mode evidence gate

1. The repository has a script `scripts/Invoke-RealLlmEvidenceGate.ps1` that runs the live Azure OpenAI tests.
2. The necessary credentials are already present in `secrets/local-real-aoai.env` (which the script automatically loads).
3. Run the script:
   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```
4. This will update the tracked files in `artifacts/release/`:
   - `real-llm-evidence-gate.json`
   - `real-llm-evidence-gate.md`
   - `real-llm-full-pipeline-metrics.json`
   - `real-llm-topology-metrics.json`

### B. Verify the output

1. Check `artifacts/release/real-llm-evidence-gate.json`. Ensure `overallOutcome` is `"PASS"` and `executionMode` is `"real"`.
2. If it fails, you may need to investigate the test failures, but assuming the codebase is healthy, it should pass.

### C. Update Claim Readiness Status

1. Open `docs/go-to-market/CLAIM_READINESS_STATUS.md`.
2. Even if the date is already today's date (2026-06-25), ensure the text reflects that the run was executed *after* the recent assessment improvements.
3. In the Gate table for **G5**, ensure the date in the "Evidence link" column is today's date (2026-06-25) and add a note that it includes the Phase B faithfulness gate.
4. In the "G5 release-evidence workflow" section, ensure the "Last owner run:" date is today's date (2026-06-25).

### D. Docs & assessment rescore

After generating the evidence, update `docs/assessments/LATEST_GPT55.md`:

1. Mark improvement **#5 SHIPPED** with date in §17.
2. Rescore headline from **84.78%** — expected movers (justify in scorecard):
   - **Runtime & First-Review Reliability** (+1 → ~91): Live AI evidence refreshed for the current RC.
   - **Correctness & Evidence Integrity** (+1 → ~87): Real-mode faithfulness and topology extraction confirmed working with the new Phase B gate.
   - Estimated headline delta: **+0.15 to +0.25 pp** (show math in scorecard table).
3. Update §7 justifications for Runtime & First-Review Reliability and Correctness & Evidence Integrity to mention the refreshed G5 evidence.
4. Do NOT create a new dated assessment file — overwrite `LATEST_GPT55.md` only.

---

## Deliverables checklist

- [ ] `Invoke-RealLlmEvidenceGate.ps1` executed successfully.
- [ ] `artifacts/release/*` files updated and staged.
- [ ] `CLAIM_READINESS_STATUS.md` updated.
- [ ] `LATEST_GPT55.md` rescored with delta table shown in PR/commit message.
- [ ] Commit message: `Real-mode evidence cadence on RC cuts (assessment improvement #5).`
- [ ] Push when user asks.
```
