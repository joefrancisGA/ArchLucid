> **Scope:** Engineering assurance for the opt-in, provider-disabled historical replay slice and its focused test evidence.

# FND-095 isolated recorded-input replay

FND-095 extends the sealed descriptor (FND-094) and governed artifact reader (FND-096). It does not wire a production endpoint, grant an actor permission, change legacy replay, or add a writer to an original run. A separately approved invocation uses a fresh project-scoped execution grant and the bound governed reader. All required inputs are verified and execution/report authorization is checked again around the isolated worker and durable audit. Restored bytes are request-local; nothing rewrites the primary artifact. An audit or authorization failure cannot return a successful report.

## Supported recipes

| Product | Scope | Supported modes |
| --- | --- | --- |
| ArchLucid | Recorded agent claim/evidence projection and deterministic correlation with pinned evidence-reference identifiers, optionally augmented by an exact accepted external-tool evidence-reference result. The raw variant invokes the existing parser with the image's schema and the historical enforcement setting. | Recorded typed and recorded raw. Typed playback makes no claim about parser behavior. |
| SecureNow | Direct exposure evidence for one target from the existing inventory reachability graph, with the captured snapshot, time and historical freshness limit pinned. An absent hop means not observed within this projection, not proven unreachable. | Recorded typed only. There is no AI stage in this recipe. |

The descriptor must name the complete supported stage graph and the exact recipe schemas. Other tool schemas, arbitrary policy/solver execution, unapproved historical packages and legacy rows without sealed descriptors are not supported by these recipes. The worker receives selected inputs, never the expected outputs, historical prompts, approved image metadata, existing audit access, or storage credentials. The structural comparison keeps all fields of the documented projections, ignores JSON property order, and preserves array order. No blanket generated ID or timestamp suppression is used. Matching the projection is not an independent judgment of truth. A broader independent corpus, semantic adjudication and claim revalidation belong to FND-097.

## Isolation and operating limits

Approve a preloaded immutable local OCI image ID for the exact product, mode and execution versions. The retained image and runtime artifacts must independently match that ID. The ID pins image configuration and referenced filesystem content, including parser, runtime and dependencies. Do not approve a build tag or use Docker on a production host as a substitute for a dedicated, controlled replay daemon. There is no pull or in-process fallback. Only the selected parser/graph computation runs in the per-operation container. The container has no network route, host filesystem volume, daemon socket or credentials, runs nonroot with read-only filesystem and no capabilities, and is limited to 256 MiB, one CPU, 64 processes and 30 seconds. A bounded controller checks output size and cleans up the container independently of request cancellation. Operational rollout must arrange daemon supervision/reaping if the daemon or controller fails during cleanup.

The focused PR lane builds a disposable fixture image, checks actual container network/resource restrictions, runs both products and the raw/typed and failure controls, and publishes TRX, request timings and FND-096 encrypted restoration evidence. These are test-environment observations, not production availability, historical image approval, or production storage/cost measurements.
