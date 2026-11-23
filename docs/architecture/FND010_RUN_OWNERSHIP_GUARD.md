# FND-010 per-run ownership check

The SCIM-backed project entitlement authority now performs an additional `IRunRepository.GetByIdAsync(scope, runId)` read after validating current directory membership and project role. The repository contract promises to return null for foreign tenant/workspace/project runs. A missing or foreign run is denied. The HTTP controller independently authorizes both the anchor and the resolved historical run before graph detail reads.

The evidence resource ID at this boundary denotes an architecture **run**, not an arbitrary canonical evidence record. Per-evidence ownership still requires its own repository contract if exposed in the future.

Focused tests cover missing scoped runs. This is not a complete real-host HTTP test; the API's authentication middleware, JWT issuer validation and actual SQL predicates require an integration test against the production-like host. Do not enable the SecureNow feature until that and CI/security review pass.
