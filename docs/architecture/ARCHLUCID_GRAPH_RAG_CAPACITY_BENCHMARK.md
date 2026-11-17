# GraphRAG capacity benchmark v3

The `graph-analysis` cohort now calls the actual `GraphRagBoundedNeighborCollector` via a narrowly scoped public benchmark adapter in the Retrieval assembly. The fixture creates deterministic, sanitized GraphSnapshot nodes and a directed chain of edges **before timing**. The collector's production algorithm builds adjacency, traverses bounded neighbors, and finds matching nodes. Traversal is limited to four hops and at most 1,000 returned neighbors; the adapter enforces finite graph input bounds.

This does **not** exercise repository loading, scope resolution, embedding, ranking, distributed caching or persisted graph evidence. The chain has low degree and cannot characterize dense high-branching product workloads. CPU includes process overhead and sampled working set is not true peak. Results remain fixture/component benchmarks and must not be automatically treated as production sizing calibrations.
