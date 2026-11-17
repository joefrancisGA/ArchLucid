# SecureNow collection admission capacity contract

The on-demand collection trigger path has two independent process-local limits:

- A fixed set of 64 tenant-hash stripes serializes duplicate local submissions within a tenant; collisions can serialize unrelated tenants.
- A process-wide eight-slot bulkhead limits active trigger processing after the tenant stripe is acquired. Both semaphores release in finally blocks and support caller cancellation while queued.

Meter: `ArchLucid.SecureNow.CollectionCapacity`
- `securenow.collection.admission_wait_ms` measures time until both gates are acquired.
- `securenow.collection.trigger_attempts` counts admitted attempts (including idempotent replays).

**Important remaining capacity gaps:** waiting callers are not subject to a finite queue or deadline independent of request cancellation; there is no guarantee of fairness across tenants; the gates and idempotency store are process-local, not distributed. This is not a durable admission claim, worker queue, or full multi-replica capacity controller. Do not represent it as such. Production configurations need a durable claim keyed by tenant/workspace/project/idempotency key and bounded queueing with an explicit overload response.

The bulkhead is deliberately limited to collection *trigger execution*. Snapshot analysis, ranking, cut-points and SQL background jobs are not controlled by it. Validate concurrency, cancellation, and multi-replica behavior before enabling stronger rejection policy.
