# SecureNow free public IP assessment

The first increment adds a read-only inventory assessment at
`GET /v1/securenow/free/public-ip-assessment/{snapshotId}`. It accepts a
known Azure inventory snapshot in the current tenant, workspace and project.
Optional `page` and `pageSize` parameters default to 1 and 50. Page size is
limited to 200. This increment does not onboard tenants or collect snapshots.

## Access

The route is off by default and is not part of the published OpenAPI
contract. For a controlled local deployment, set
`SecureNow:FreePublicIpAssessment:Enabled` and populate
`SecureNow:FreePublicIpAssessment:AllowedScopes` with explicit
`TenantId`, `WorkspaceId` and `ProjectId` entries. An authenticated
`ReadAuthority` request must use the SecureNow product line. On a dual
deployment, select it using `X-ArchLucid-Product-Line: security`.
These configuration grants are independent of paid architecture-review and
SecureNow entitlements. No tenant tier or marketplace plan is modified.

## Interpreting the assessment

- `attached` identifies a direct attachment recorded in the inventory graph.
  `noAttachmentObserved` means the capture did not record an attachment, not
  that the current Azure resource is proven to be detached. Partial captures,
  redacted data and unresolved or ambiguous attachments can yield `unknown`.
- `restrictiveControlPresent` means the attached resource has a stored
  restriction such as disabled public network access or a recorded inbound
  deny rule on its NIC/subnet NSG. It does not resolve rule precedence,
  effective flow or firewall behavior. Otherwise an attachment is
  `insufficientEvidence` for an intended reachability claim.
- `observedReachability` is always `notAssessed`. The service runs no
  traffic probes, sends no requests to the IPs and performs no remediation.
  The capture timestamp describes the inventory, not a traffic observation.
- Evidence citations use the enclosing snapshot ID and inventory resource row
  IDs. The response contains no attack paths, ranks, verification records,
  Defender or identity detail, tags, raw source URLs, or rule text.
