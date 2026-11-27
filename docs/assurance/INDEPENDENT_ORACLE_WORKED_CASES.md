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
