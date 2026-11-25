# FND-061 authorization before cited-run seal reads

The Evidence Hub authorizes each distinct run discovered from the explicit or
default inventory snapshot before requesting that run's committed manifest.
It reuses the caller-aware run-share decision already wired for Ask. A revoked,
missing or out-of-scope citation does not trigger manifest hydration or change the
response. The separate scoped inventory read can proceed. A readable run with
an invalid seal still blocks the response with HTTP 409.

Other callers of the shared infra snapshot seal helper have not been migrated in
this slice. The change does not certify their authorization or the separate
snapshot and assessment scope checks. FND-061 remains partial.
