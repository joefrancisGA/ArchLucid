# ADR FND-003 — Extension and plugin SDK contract boundary

Status: Proposed; schema-only, disabled-by-default scaffold (2026-11-22).

## Existing integration surfaces to preserve
- `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md` and `docs/library/CUSTOM_AGENT_HANDLERS.md`: existing custom-agent handler guidance; do not imply these already implement this manifest.
- `docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md`: existing finding engine output expectations.
- `schemas/integration-events/`: existing integration event catalog and schemas.
- `ArchLucid.Contracts/Findings/Finding.cs`: current finding DTO, not replaced by a plugin manifest.

## Proposed decision
An extension declares its identifier, semantic version, publisher, supported capabilities, requested permissions, and host contract compatibility in a versioned manifest. Discovery is metadata-only: it never loads executable code or grants requested permissions. The first schema forces `executionMode=disabled`. No dynamic plugin loader, production execution or autonomous remediation is implemented.

Capability identifiers are limited to read architecture, propose findings, propose remediation, and propose verification. The latter three are proposals only, never authority to execute. The manifest does not establish publisher authenticity, tenant authorization or permission grants.

## Security and runtime design gates
1. Verify publisher signature and artifact digest independently before admission.
2. Bind tenant identity to authenticated host context; never accept it from a manifest.
3. Require explicit administrator grants narrower than or equal to requested permissions, per tenant and extension.
4. Execute future extensions in isolated, resource-limited workers with CPU, memory, time and network quotas; default network denied.
5. Validate extension outputs against versioned contracts and evidence provenance. Treat all output as untrusted.
6. Enforce compatibility and revocation; unsupported major versions fail closed.
7. Record invocation, denial, output, and approval events in the audit plane.
8. Keep all 2.0 extension runtime paths disabled until separately reviewed and tested.

## Future work
Add schema/fixture tests and CI, a host capability discovery interface, signature verification, quota enforcement and revocation. Each is a separate gated implementation. Ship 1.0 first.
