# FND-061 infrastructure evidence Ask authorization

SecureNow's infrastructure evidence Ask endpoint now uses the existing caller
run-share decision for explicit run selectors and snapshot citations before
committed manifests are read. An unavailable explicit run or scoped snapshot
returns the existing insufficient-evidence response, without collecting evidence
or invoking the model. A snapshot must be found in the active tenant, workspace
and project before looking up its citations. Unreadable citations cannot affect
the result for an otherwise readable snapshot. A readable run with an invalid
seal still returns HTTP 409.

Focused regressions cover explicit runs, snapshot citations and combined
selectors, including revocation, missing scope and corrupt seals. This covers
the request's explicit run and snapshot selectors. It does not certify
authorization for all other evidence sources or callers. FND-061 remains partial.
