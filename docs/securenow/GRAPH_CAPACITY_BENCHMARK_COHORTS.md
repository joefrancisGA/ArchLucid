# SecureNow synthetic graph benchmark cohorts

The SecureNow performance workflow executes deterministic topology-profile fixtures:
- Directed chains: 1,000 and 5,000 vertices (existing)
- Sparse chain: 1,000 vertices, depth 3
- Dense fully connected directed graph: 40 vertices, depth 4
- Cyclic ring: 1,000 vertices, depth 8
- High-branching directed graph: 1,000 vertices, at most eight forward neighbors, depth 6

The additional cohorts use a maximum of 10,000 structural path prefixes per run, and emit versioned JSON files under `artifacts/securenow/graph-capacity` when the workflow sets `SECURENOW_GRAPH_PROFILE_OUTPUT_DIR`.

These are synthetic, bounded in-process structural traversal measurements, not SecureNow security-path semantics. CPU measurements are process-wide, and two working-set observations do not establish peak memory. Truncated cohorts are reported as truncated, not used as calibrated capacity forecasts. This does not change authorization, evidence, or production workload admission.
