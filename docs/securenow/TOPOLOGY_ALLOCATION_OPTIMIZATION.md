# SecureNow topology counter allocation optimization

The topology prefix counter uses iterative depth-first traversal with a single path-local visited set instead of cloning a HashSet for every candidate extension. The implementation retains seed and neighbor ordering, path-local cycle exclusion, bounded depth, path-prefix ceiling and structural-only evidence status. It preserves the number of examined edges by recording distinct outgoing adjacency on node expansion.

The shared path visited set is O(depth) and stack frames no longer retain per-prefix sets. This is a source-code allocation reduction, **not yet a measured reduction in peak RSS or managed allocations**. Run the existing dedicated-process graph-memory CI suite before making numerical performance claims. The runner is advisory, not an attack-path semantics change or production admission control.
