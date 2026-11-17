# SecureNow graph-cardinality capacity envelope

`SecureNowGraphCardinalityForecast.Estimate` accepts observed node and edge counts plus **caller-selected** seed count, hop cap and maximum branching factor. It returns mean out-degree and a saturating theoretical upper bound for candidate path prefixes.

The bound is the geometric sum of seed-frontier expansion through the hop cap. It intentionally ignores deduplication, directed graph topology, cycle rejection, path semantics, and pruning. Therefore it is **not** a forecast of actual stored paths or memory/cost demand. The branching factor is an external traversal assumption, NOT inferred from mean degree. Output always says `THEORETICAL_ENVELOPE_UNCALIBRATED`; a saturated result signals the bound exceeded `long.MaxValue`.

To graduate toward capacity planning, compare these envelopes against actual SecureNow engine expansion counts on sparse, dense, cyclic, multi-tenant and real-inventory fixtures. Add percentiles and calibrated error bounds before predicting CPU, memory, or USD costs. No production gates or evidence decisions consume this calculator.
