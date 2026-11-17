> **Scope:** Internal SecureNow operator note. Not a support SLA, not a diagnostics package. SecureNow beta remains **NO_GO**.

# SecureNow when you are stuck

Check these four situations before you email. A missing capture is a gap, not a clean bill of health.

| Situation | What it means | Where |
| --- | --- | --- |
| Collection missing or stale | A gap is a coverage limitation. It is not proof the environment is clean. | `/integrations/cloud-connections` |
| Connector will not finish | Read the connector status. A failed connector is not a completed capture. | `/administration/connection-status` |
| No ranked path, or not verified | An empty ranking is not proof you are secure. **Not verified** means a later capture, your attestation, completed analysis, or the postcondition is missing. SecureNow does not change Azure. | `/security/remediation-factory` and `/security/remediation-instances` |
| Still stuck | Email `support@archlucid.net` with subject `SecureNow`. Include tenant, workspace, subscription, collection time, and path id when you have one. Do not paste secrets, tokens, or connection strings. | `mailto:support@archlucid.net?subject=SecureNow` |

This note does not promise a timed response, a hired rotation, or a fix applied by SecureNow. Acknowledgement targets stay in [`SUPPORT_COMMITMENT.md`](SUPPORT_COMMITMENT.md).
