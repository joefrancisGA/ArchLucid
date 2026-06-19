# Fix: CI run #2180 — agent offline regression missing baselines for 2 corpus prompts

**Run:** 27488816955 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Job:** `CI: agent offline regression (eval corpus + prompt JSON baseline)` (databaseId `81250063864`)

## Symptom

```
::error::missing baseline for corpus-adv-unsupported-roi-claim
::error::missing baseline for corpus-adv-out-of-domain-request
::error::baseline regression check failed
```

The eval corpus script (`scripts/ci/eval_agent_corpus.py`) exits 1 because two corpus prompts lack
their baseline JSON files under `tests/golden-cohort/baselines/`.

## Root cause

Two new adversarial corpus prompts were added (or promoted to baseline-required status) but their
baseline files were not generated and committed:

- `corpus-adv-unsupported-roi-claim`
- `corpus-adv-out-of-domain-request`

The git status confirms both baseline files are **untracked** locally:

```
?? tests/golden-cohort/baselines/corpus-adv-out-of-domain-request.baseline.json
?? tests/golden-cohort/baselines/corpus-adv-unsupported-roi-claim.baseline.json
```

## Fix

Commit the two untracked baseline JSON files to the branch. They already exist locally under
`tests/golden-cohort/baselines/` — they just have not been staged:

```powershell
git add tests/golden-cohort/baselines/corpus-adv-out-of-domain-request.baseline.json
git add tests/golden-cohort/baselines/corpus-adv-unsupported-roi-claim.baseline.json
git commit -m "fix(ci): commit missing adversarial corpus baseline files"
```

Before committing, verify the baseline JSON files are well-formed and represent the expected
simulator/offline response for each prompt:

1. Read `tests/golden-cohort/baselines/corpus-adv-out-of-domain-request.baseline.json` — confirm it
   is valid JSON matching the schema expected by `eval_agent_corpus.py`.
2. Read `tests/golden-cohort/baselines/corpus-adv-unsupported-roi-claim.baseline.json` — same.

If the files are empty or malformed, regenerate them using the corpus script in record mode:

```bash
python3 scripts/ci/eval_agent_corpus.py --record-baseline corpus-adv-unsupported-roi-claim
python3 scripts/ci/eval_agent_corpus.py --record-baseline corpus-adv-out-of-domain-request
```

(Check `eval_agent_corpus.py` for the exact flag — it may be `--baseline-record`, `--update`, or
similar. Grep the script for "record" to find the right flag.)

## Acceptance criteria

1. `tests/golden-cohort/baselines/corpus-adv-out-of-domain-request.baseline.json` is committed and valid.
2. `tests/golden-cohort/baselines/corpus-adv-unsupported-roi-claim.baseline.json` is committed and valid.
3. `python3 scripts/ci/eval_agent_corpus.py --baseline --enforce-quality-gate` exits 0 (no
   "missing baseline" errors for these two prompts).

## Verification (read-only, no LLM)

```bash
python3 scripts/ci/eval_agent_corpus.py --baseline --enforce-quality-gate
```

The script runs in offline/simulator mode and should complete quickly without real LLM calls.

## Related

- `scripts/ci/eval_agent_corpus.py`
- `tests/golden-cohort/baselines/` — other baseline files for reference format.
