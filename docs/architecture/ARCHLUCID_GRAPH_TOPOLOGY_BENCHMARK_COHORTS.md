# GraphRAG benchmark topology cohorts

The isolated capacity benchmark now invokes the real `GraphRagBoundedNeighborCollector` through the existing adapter for three generated topology variants:

- `graph-analysis`: directed chain of requested size.
- `graph-dense`: a complete directed graph among the first 100 nodes (the remaining nodes are disconnected). This is **not** a full dense graph of all requested nodes.
- `graph-branching`: up to eight forward neighbors per node.

All inputs are generated before the timed operation. The collector treats edges as bidirectional and applies its normal four-hop and result-count limits. The CI workflow runs all three graph types three times in fresh benchmark processes and uploads observations.

These tests exercise actual in-memory GraphRAG neighbor traversal but **not** the repository-backed `GraphRagNeighborExpander.ExpandAsync` path, SQL/blob snapshot loading, ranking, vector embeddings, or production graph distributions. The dense cohort's effective 100-node core should be considered when interpreting a 5,000-node fixture. No production workload calibration is asserted.
