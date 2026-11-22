# FND-010 .NET evidence access gate — first production-language increment

Adds a reusable .NET `EvidenceReadAuthorizationGate` using the application's existing `ArchLucidPolicies.ReadAuthority` policy and authenticated `IScopeContextProvider`. It requires an authenticated principal, nonempty tenant/workspace/project/evidence IDs, exact scope match, and successful policy evaluation. Errors fail closed. Focused tests cover allow, foreign tenant, anonymous, policy denial and invalid resource ID.

**Not yet wired to a live evidence endpoint or DI registration.** No existing route behavior is changed. A route must invoke this guard before its first evidence read, and the repository must independently enforce tenant/workspace/project predicates. The existing ReadAuthority policy is broad; resource-specific entitlements, claims binding, policy audit, and per-evidence authorization handlers require review before production use. This guard alone does not prevent access if callers bypass it.

The C# type is intentionally standalone to minimize ArchLucid 1.0 risk. CI must compile and pass before any production wiring.
