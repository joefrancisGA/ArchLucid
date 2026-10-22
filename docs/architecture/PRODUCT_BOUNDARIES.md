> **Scope:** Current product ownership and dependency direction within the shared deployment.

# ArchLucid and SecureNow product boundaries

The current deployment has one API, one Worker, and one SQL catalog. These are
shared hosts, not proof that each product can be deployed independently. The
capability map in `data/product-capability-map.json` assigns API controllers
and Application namespace clusters to platform, authority, infra-evidence,
or governance. The Worker map assigns hosted services. Both maps are checked
by `ArchLucid.Architecture.Tests`.

| Capability | Owner | Contract boundary |
| --- | --- | --- |
| Platform | Shared identity, tenancy, operations, and delivery | Core/Contracts ports and host composition |
| Authority | ArchLucid architecture runs, agents, synthesis, and review | Core/Contracts ports; no SecureNow operational engine dependency |
| Infra-evidence | Inventory and SecureNow operational security analysis | Snapshot and security contracts in Core/Contracts |
| Governance | Shared policy and approval workflows | Core/Contracts ports; product-specific consumers compose at the host |

The existing namespace ratchet prevents new platform, infra-evidence, and
governance dependencies on authority internals without a shrinking allowlist.
`SecureNowProductBoundaryTests` protects the reverse direction: authority and
platform Application types cannot depend on SecureNow architect, operational
finding, exception, asset-assertion, and remediation implementation namespaces.
If a type must cross that boundary, introduce a product-neutral port or DTO in
Core/Contracts, or coordinate it at the host. Keep a product-specific DTO in
its owning capability when sharing it would misrepresent its semantics.

This is an incremental dependency guard, not a second host or database split.
`TECH_BACKLOG_TB2400_INDEX.md` tracks those larger extraction decisions.
