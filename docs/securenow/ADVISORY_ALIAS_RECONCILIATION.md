# Canonical SecureNow advisory intake

Advisory producers can opt into reconciliation by including `securenow.advisory-alias.v1` as
an additional JSON-string metadata value on operational finding ingest. The existing
`securenow.advisory-remediation.v1` evidence remains required. This is a bridge for already
normalized MSRC CSAF/VEX guidance and supplemental scanner records, not a live feed poller.

```json
{
  "cveId": "CVE-2026-12345",
  "targetKey": "container-apps/workload-runtime",
  "revision": "vendor-revision-2",
  "referenceOnly": false,
  "defenderRecommendationId": "optional-existing-recommendation",
  "crosswalkVersion": "2026.1"
}
```

- Use one CVE per record and a stable target key for the affected product or deployment
  component. Project scope, cloud provider, CVE, resource ID (or platform sentinel), and target
  key define the record. A CVE alone never establishes deployment exposure.
- Supply the publisher revision's explicit UTC observation time. The source system identifies
  the publisher authority (use the same configured source for CSAF and VEX from that issuer);
  the submitted item ID, publisher advisory ID, revision and URL remain in source provenance.
  This authenticated submission is attributed to the actor. SecureNow does not fetch or
  authenticate the cited source on this path.
- A mirror or supplemental scanner report marked reference-only attaches provenance to a
  known advisory without changing its lifecycle, proof, or chronology. It cannot establish a
  canonical finding. A non-reference source may not overwrite an existing authority. Newer
  equivalent guidance from the authority is silent and can advance its chronology. Changes
  to ownership, status-relevant guidance, risk, mitigation references, or approved mapping
  re-evaluate only the canonical target.
- Pass a Defender recommendation and crosswalk version together if a reviewed mapping already
  exists. A unique eligible reviewed audit or architecture control flows into the existing
  remediation pattern matcher. Missing, ambiguous or merely related mappings do not create
  control IDs. A mapped control is not proof of affected configuration or deployed remediation.
- Legacy operational findings and non-opted-in advisories keep their existing identity.
  The ingest result returns the canonical finding ID. Previously imported aliases are not
  automatically migrated. Raw feed acquisition and publisher authentication are separate.
