# Historical capacity forecast evidence

`WorkloadForecastHistory.Import` accepts bounded, versioned JSON observations supplied by an operator or telemetry exporter. Each observation requires a release revision, workload class, metric, unit, UTC timestamp, forecast and actual. `Summarize` groups equal workload/metric/unit cohorts and computes mean absolute error, mean absolute percentage error (defined actuals only) and the latest percentage error.

Do not treat differently configured infrastructure, software revisions, measurement scopes, or tenant populations as comparable observations merely because their metric strings match. The API deliberately does **not** pull from Application Insights, Prometheus or the production database and does not write persisted tenant-specific telemetry. The caller must document provenance and unit equivalence and collect the observations through approved mechanisms.

No automated calibration is claimed and no CI hard gate or deployment setting is changed. Longitudinal summaries are descriptive, not calibrated confidence intervals or proof of forecast accuracy.
