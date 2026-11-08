# SecureNow workload-cost forecasting — initial source model

`SecureNowCapacityCostForecast.Calculate` is a deterministic **scenario calculator**, not an authoritative billing or budget forecast.

It accepts a monthly snapshot count, per-snapshot CPU seconds, memory GiB multiplied by worker occupancy seconds, SQL operations per snapshot, storage GiB-months, and caller-provided unit rates. It outputs compute, storage, SQL, and total modeled USD. Negative inputs and arithmetic overflow are rejected. No default rates or ungrounded provider pricing are bundled.

**Calibration contract:** Pass `ratesAndUsageMeasured=true` only when rate sources and workload quantities are externally verified. Even then, the label `MEASURED_INPUT_SCENARIO` identifies input provenance, *not* actual billed cost. Compute estimates do not yet account for idle replicas, startup, data transfer, transaction tiers, reserved capacity, or minimum charges. Peak memory is a simple occupancy approximation, not allocated-memory accounting.

Next: collect measured CPU, memory occupancy, SQL usage, and storage by tenant workload in representative benchmark traces, then add uncertainty bounds and source/version metadata. Never use this model to make customer savings or SLA claims without calibration.
