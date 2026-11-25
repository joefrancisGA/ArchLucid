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
No rollout thresholds, settings or defaults change. Representative
false-alarm and latency evidence is still needed before marking FND-073 complete.
