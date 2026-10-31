# Topology-aware cardinality analysis

`SecureNowTopologyCardinalityForecast.Count` counts simple directed path prefixes from supplied adjacency and seeds up to a fixed hop depth, tracking repeated-node cycles per path. It is read-only and independent of snapshot data stores.

Unlike the geometric envelope estimator, it uses the actual supplied adjacency topology. An optional maximum prefix budget limits expansion and marks output truncated. This does not yet implement SecureNow's security-specific hop rules, provenance filtering, confidence restrictions, or privilege semantics. It should not be labeled a count of valid security attack paths.

Before connecting to the live pipeline, instrument actual traversal expansions, bound edge and per-node adjacency input size, and collect CPU/allocation measurements on sparse/dense/cyclic graphs. This implementation has no admission-control or evidence-writing effect.
