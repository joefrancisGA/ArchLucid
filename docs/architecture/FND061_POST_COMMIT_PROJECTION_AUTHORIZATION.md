# FND-061 authorization before post-commit projections

The authority commit stage is the production producer of post-commit jobs. The worker checks the explicit tenant/workspace/project and active drain scope, then uses the uncached run header and exact manifest to verify committed status, the scoped identity, the evidence anchors, and the seal before dispatching a run projection.

Provenance uses the same verified-anchor reader as retrieval indexing. It does not re-resolve a run or manifest from cache, and rejects mismatched graph or findings output. Reranking uses the verified findings anchor instead of looking up a run without scope. IaC enrichment uses the verified run and its findings anchor, and the legacy decision-appendix handler receives the same checked run. Review events derive their project from the verified scope instead of the redundant outbox payload.

Tenant-wide sample cleanup is an explicit work type. New jobs store the triggering run ID in the existing queue column. The worker requires a sealed, non-sample commit in the same scope and a drain that is not restricted to a workspace or project. Older queue entries without that trigger cannot initiate cleanup. The purge repository still limits the operation to sample rows for the verified tenant. No schema migration, backfill, replay, or production purge is part of this change.

This slice extends the focused FND-061 workflow. It does not alter branch protection or mark the backlog entry complete.
