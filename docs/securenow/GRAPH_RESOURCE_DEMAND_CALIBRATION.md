# SecureNow graph resource-demand calibration

`SecureNowGraphResourceDemandForecast` converts a topology-aware structural prefix count to a **scenario estimate** only when callers supply a measured benchmark calibration. It never invents runtime CPU, RAM or elapsed worker-time data. Missing calibration, truncated prefix enumeration, or a count above the validated benchmark envelope returns `ForecastAvailable=false`.

Calibration references a specific benchmark revision, observed prefix count, CPU seconds, peak GiB and worker seconds. Within the stated envelope, CPU and worker-time estimates use a linear ratio assumption; peak memory remains the observed calibration figure, **not** a workload-specific memory prediction or a safe maximum. This simple ratio can be wrong for different topologies even with identical path counts.

This is deliberately a read-only application-layer helper. There is no live benchmark collector, tenant cost billing integration, automatic admission, SLA assertion, or production load forecast. For trustworthy resource planning, add calibrated cohorts that vary edges, degree distribution, path depth and graph density, plus confidence/error ranges and per-engine measurements.
