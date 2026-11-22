# FND-010 resolved historical snapshot authorization

The feature-gated SecureNow snapshot route now checks authorization twice: first for the requested anchor run before the first repository read, then for the resolved historical run before the first authority graph-detail read. It also rejects a resolved run whose persisted project ID differs from the anchor's project ID. Missing gate or denied access returns a non-disclosing 404. Legacy non-SecureNow behavior remains unchanged.

Existing SecureNow snapshot contract tests are adapted to provide an authenticated principal and authorization service. This does **not** prove resource-specific entitlements: the existing ReadAuthority policy is broad, and no per-run authorization handler has yet been added. Repository-level tenant/workspace/project scope predicates remain mandatory. Real HTTP cross-tenant negative tests, full CI, and code review are still release blockers. No feature flag was enabled.
