# ADR FND-004 — Experimental isolation

Status: Proposed foundation; not wired to a production call site.

## Current-state inventory
- `ArchLucid.Core/Configuration/IFeatureFlags.cs` defines the existing async flag evaluation abstraction.
- `ArchLucid.Host.Core/Configuration/FeatureManagementFeatureFlags.cs` delegates to Microsoft.FeatureManagement.
- `ArchLucid.Host.Core/Authority/FeatureManagementAuthorityPipelineModeResolver.cs` deliberately defaults SQL async authority pipeline **on** when its existing flag is absent. **Do not alter this 1.0 behavior.**
- `archlucid-ui/src/lib/feature-flags.ts` has a separate build-time experimental UI toggle; UI flags are not server-side authorization.
- Existing operational kill switches are domain-specific; do not assert this is a universal live kill switch.

## New, inert 2.0 hook
`ArchLucid.Core/Configuration/ExperimentalCapabilityGate.cs` defines a fail-closed evaluation helper with:
1. Global enabled switch (caller supplied, default must be false).
2. Global kill switch (caller supplied, overrides all enables).
3. Independently established tenant authorization (caller supplied, never derived from a request parameter).
4. Explicit allowlist of 2.0 capabilities.
5. Existing `IFeatureFlags` evaluation for a named capability only after all other gates pass.

This is **not** an enforcement mechanism until a future caller wires it at every execution boundary. No production 2.0 capability is enabled by this change.

## Implementation gates before wiring
- Derive tenant authorization from authenticated context and resource-scoped authorization; test cross-tenant rejection.
- Obtain configuration from trusted server-side sources; define a fast, independently verifiable emergency disable path.
- Audit changes to grants and enablement, with actor, reason, expiry, and correlation.
- Test default-off, kill-switch precedence, unauthorized tenant, unknown capability, provider errors, and allowed path.
- Verify that queued work rechecks authorization and kill state immediately before execution.
- Do not permit client-side flags or extension manifests to authorize remediation.
- Preserve 1.0 release CI and security gates; no speculative module enters production.

## Retirement
Review each experimental capability before release and remove obsolete flags after promotion or cancellation.
