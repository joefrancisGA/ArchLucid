> **Scope:** Internal correctness examples for the FND-171 test provenance inventory, not evidence of complete product coverage.

# Independent oracle worked cases

## Cosine triangle and orthogonality

The dot-product definition of cosine divides the dot product by the product of the two Euclidean norms. The horizontal unit vector has dot product ±3 with (±3, 4), whose norm is 5. The expected values are therefore ±3/5. Axes at right angles give 0. Opposite signs must remain distinguishable. The numerical tolerance on this case is twelve decimal places, not an embedding model quality claim.

## Cosine undefined-input fallback

An empty vector pair, mismatched dimensions, or a zero norm cannot define a cosine. The scorer's telemetry helper uses its existing neutral raw value, 0, for those cases. This is a compatibility contract, not a mathematical assertion or a definition of a general near-zero threshold.

## Telemetry affine endpoints

An increasing affine mapping taking -1 to 0 and 1 to 1 has slope 1/2 and intercept 1/2. At inputs -1/2, 0, and 1/2 the exact outputs are 1/4, 1/2, and 3/4. The closed interval is the histogram contract, so inputs beyond either endpoint saturate. This does not specify handling of NaN or signals outside this scorer.

## Distinct paths example

The number affected by a cut is the cardinality of the set of input path IDs containing that node or edge. For A = [(p, link, r)], B = [(p, link, q), (p, link, q)], and C = [], p belongs to A and B, r belongs only to A, and q belongs only to B. Each of the two directed edges belongs to one path. C contributes no candidates. The repetition is a neutral oracle control, not an assertion that such paths are accepted by every production validator.

## Simple directed walk edge budget

Consider A → B → C → A, plus disconnected D. Starting at A, and counting edges rather than vertices, zero edges produces no nonempty path. With a budget of 1, the only permitted path is A → B. With a budget of 2, the path A → B → C is also permitted. Increasing the budget to 3 creates no new simple path because revisiting A would repeat a vertex. D is never visited. This is an inclusive budget for the neutral reference oracle, not a statement of the exact-cap convention for production exploration.

## Topology no-op and idempotence

Under the empty-merge identity law, combining a graph with no proposals leaves its topology unchanged. The derived structure-gap set must therefore remain identical. Under the idempotence law for deterministic proposals, applying the same proposal twice has the same structural effect as applying it once. These tests compare relationships between runs. They do not prove the absolute correctness of a gap code or that any particular proposal should be accepted.


## Inclusive intended reachability hop limit

Owner decision, 2026-11-27. The limit counts edges traversed by the production intended reachability walk. A qualifying terminal at depth N is eligible when the hop limit is N. Do not follow any of that node's outgoing edges after reaching the limit. Evidence annotations are not additional traversed edges.

For the constructed chain start → alpha → beta → gamma, the qualifying terminals sit at depths 1, 2 and 3. With a limit of 2, emit alpha and beta, omit gamma, and report truncation because gamma was not explored. At a limit of 3, emit all three. A return edge to an already visited vertex is not unexplored work. From start → alpha and start → beta, both terminals are one hop away, but a result-count or per-node fan-out cap of 1 still permits only the first branch. Terminal eligibility, scope filtering, cycle prevention, and the separate privilege-path traversal contract are unchanged.
