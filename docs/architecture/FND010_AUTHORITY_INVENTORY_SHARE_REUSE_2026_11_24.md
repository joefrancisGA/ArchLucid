# FND-010 authority run inventory sharing — 2026-11-24

Baseline `12aa11b64fba98b6a86c4a86a56a8c89b9423312`. The canonical `GET /v1/runs` and the authority aliases `GET /v1/authority/reviews` and `GET /v1/authority/projects/{projectId}/reviews` previously requested scope-filtered pages with trace enrichment. They shared a scope-wide seal preflight that selected the newest committed run from the first 50 summaries and could load its manifest before checking architecture sharing.

These routes now share an inventory reader that applies the existing run sharing decision to scoped candidate headers. Only visible rows contribute to the returned page, lookahead and cursor. Trace enrichment runs on the returned visible rows only. The seal preflight still checks the newest committed run within the first 50 recent rows across the scope, using the caller's visible rows. A visible committed run with an invalid seal still blocks the inventory with HTTP 409.

The reader uses the existing scoped keyset queries and the existing run-summary mapper and bulk trace enrichment. It stores a bounded set of sharing decisions within one request to reuse overlapping preflight and page checks. A sparsely shared inventory can require scanning multiple raw pages. Candidate batches stay bounded and honor cancellation.

The focused API suite covers all three routes, raw page boundaries, trailing hidden rows, an all-hidden inventory and a visible invalid seal. Both architecture inventory routes now share the visible-header reader as well.

`GET /v1/architecture/reviews` and its legacy alias `GET /v1/architecture/runs` use the caller's scoped run-share decisions before applying the offset, page size, and continuation probe. Their response shape, cursor format and private no-store policy are preserved. ETags identify the row versions and continuation metadata, so a grant or revocation affecting only the lookahead row changes the validator.

The architecture inventory tests cover both routes in offset and keyset mode, including share changes with stable visible rows and row versions, a genuine unchanged-page 304, and visible-row offsets across raw page boundaries. Offset reads scan visible candidates from the start of the inventory and can require more queries at deep offsets.
