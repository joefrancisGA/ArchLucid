# OWASP ZAP baseline

## Tiers

| Tier | Workflow | Behavior |
|------|-----------|----------|
| **PR (merge gate)** | `.github/workflows/ci.yml` → `security-zap-api-baseline` | `zap-baseline.py` **without** **`-I`** and **`-c config/baseline-pr.tsv`**: **WARN and FAIL** both fail the job. |
| **Scheduled** | `.github/workflows/zap-baseline-strict-scheduled.yml` | Same command and config — second line of defense for drift; **no** `continue-on-error`. |

Rule format and triage: **[docs/security/ZAP_BASELINE_RULES.md](../docs/security/ZAP_BASELINE_RULES.md)**.

## Layout

- `baseline-pr.tsv` — tab-separated rule overrides (`RULE_ID`, `IGNORE` \| `INFO` \| `FAIL`, description). Mounted read-only into the ZAP container as `/zap/wrk/config/baseline-pr.tsv`.
- CI mounts a **writable** host directory at `/zap/wrk` (see workflows) so `zap-baseline.py` can create `zap.yaml` there; the official image often runs as a non-root user that cannot write the image’s default `/zap/wrk`. Workflows run `chmod -R a+rwx` on that host path because GitHub’s `runner` user (typical uid 1001) owns `RUNNER_TEMP` while the ZAP image’s `zap` user is often uid **1000**, which would otherwise get **Permission denied** on `zap.yaml`.

## Operations

- If ZAP fails in CI or on the schedule, open the job log for the summary (`FAIL-NEW`, `WARN-NEW`), then either fix the finding or add a deliberate `IGNORE` with a short justification in `baseline-pr.tsv` (see **ZAP_BASELINE_RULES.md**).
- Do not mount SMB (445) or expose internal admin URLs to ZAP; the CI job targets only the local Docker network.
