# FND-073 SecureNow synthetic recovery

A SecureNow non-streaming completion that already has a provider-quality
recovery lease uses a synthetic inventory challenge in place of its path prompt.
It sends no customer inventory on that recovery call and does not add a provider
call. The provider must classify every row, including missing, redacted and
unrecognized values. Only an exact nonce and complete, correct response can
recover the current bound lease. Extra content is not verified. The existing
transport stamp, deployment/model version, trace binding and lease expiry still
apply. The path returns its deterministic stored summary for the recovery call.

The oracle checks this finite response only. It does not certify ordinary
provider output or authorize recovery for unrelated products or traces.
Synthetic results with no matching active lease do not count as observations.
No rollout thresholds, settings or defaults change.

The durable loopback-SQL replay supplies safe offline rollout evidence for six
default-policy scenarios: steady supported traffic with sparse contradictions,
coverage-limited and unknown-only evidence, mixed unsupported evidence, and
sustained contradicted or unsupported evidence. The gate requires zero healthy
false quarantines, detection of every degraded cohort, preservation of unknown
outcomes, and a 250 ms p95 budget for both update and admission operations.

This replay is policy-representative, contains no customer data and is not
production telemetry. Production-path telemetry and passing evidence on master
are still required before marking FND-073 complete.
