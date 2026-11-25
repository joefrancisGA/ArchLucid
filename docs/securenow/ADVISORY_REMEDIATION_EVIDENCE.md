# Advisory remediation evidence

SecureNow distinguishes a publisher's guidance from evidence about the running deployment.
The scoped operational-security ingest route accepts a versioned metadata entry
`securenow.advisory-remediation.v1` containing a JSON string. It uses the same authorization,
project scope and audit path as existing finding writes. The link and classification are
attributed to the authenticated submitter. SecureNow does not fetch or authenticate the
publisher's contents in this path. A future feed adapter can verify and normalize those claims.

Example metadata **value** for one affected customer deployment:

```json
{
  "advisoryId": "ADVISORY-1",
  "sourceUrl": "https://vendor.example/advisories/ADVISORY-1",
  "owner": "Shared",
  "providerFix": "Fixed",
  "customerAction": "Required",
  "compensatingControlEvidenceReference": "evidence:waf-check"
}
```

Supply the target `CloudResourceId` for Customer or Shared claims. Use a distinct source
finding identity for each deployment and retain it across revisions. Submit advisory
observations as Open. The application derives Informational only from **Provider + Fixed +
NotRequired**. Informational entries remain visible but are not open work or weekly intake
in factory metrics. They are not classified as Verified and say nothing about past exposure.
An unknown obligation is not suppressed. A WAF or other temporary protection is a cited
compensating control, not deployment proof.

For deployment verification, include a known fixed artifact's lowercase or uppercase
SHA-256 hex digest as `fixedDeploymentArtifactSha256`. The frozen approved pattern must
require `property:observedDeployedArtifactSha256=<digest>`. The existing verifier requires a
later successful scoped inventory capture and the matching observed value on the exact
target deployment. The property represents the running deployment's artifact, not a
registry tag, configured digest, IaC declaration or WAF capability. A collector should
provide it only when the running artifact is unambiguous. Without this evidence the
finding remains open. This change does not add a workload collector.

A verified instance keeps its existing evidence and control association. The SQL
finding update closes only the same scoped revision, and will not close a changed or
newer finding based on that result. Such a finding requires verification of the current
revision. A plain ingest status cannot close an advisory. Cross-source identity
reconciliation and automated advisory intake are tracked in #8108.
