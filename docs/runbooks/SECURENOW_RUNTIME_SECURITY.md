# SecureNow runtime security: deployment and recovery

Status: opt-in, pre-production until focused CI and a real authorized workload rehearsal pass.

## Trust boundaries

- Keep SecureNow:RuntimeTelemetry:Enabled and SchedulerEnabled false until provisioning and validation are complete.
- Each Scopes child is the uppercase SHA-256 of the exact System.Text.Json UTF-8 serialization of RuntimeObservationRequest (tenant, workspace, project, resource, deployment generation, runtime family). Generate this key using RuntimeTelemetryProvisioning.ScopeKey, not a hand-assembled string.
- Bind EvidenceRunId and InventorySnapshotId to the authorized project and canonical inventory. Inventory must be refreshed within 24 hours.
- Install a trusted worker identity provider that independently authenticates the service identity; the default denies all. Publication requires explicit per-scope Publication:Enabled, Subject and Issuer. Never derive identity from scheduled request JSON. HTTP callers must not inherit worker grants.
- Provision an independently verified catalog under AdvisoryCatalog:PayloadBase64 and VerifiedSha256; the digest is a trust pin, not proof of vendor accuracy. IdentityBindings uses the same independent verification principle. Never pin arbitrary user input.
- Use system-assigned managed identity with narrowly scoped Key Vault sign access to a versioned P-256 key. Set Publication:KeyId and KeyVaultKeyUri; separately provision Keys:<keyId>:Enabled, NotBefore, ExpiresAt, PublicKeyBase64.
- The workload agent is an external prerequisite. It must observe actual executing processes and independently establish deployment identity and enumeration coverage. Do not substitute ARM configured versions, installed package lists, or caller assertions. Collector:Enabled, KeyId and PublicKeyBase64 bind the agent's independent key.

## Storage and scheduling

Use separate absolute CollectorRoot and SpoolRoot directories with restrictive OS ACLs, no symlinks or shared untrusted writers. Agents publish signed envelopes by same-directory atomic replacement. Local filesystem checks are not protection against a privileged hostile writer.

Apply forward migrations 434 and 435 using the supported tenant catalog migration workflow. Confirm the application role cannot directly mutate watermarks or journal records, and can execute only the intended procedures. Keep existing sealed findings snapshots unchanged.

Enable scheduling only for an explicitly designated single replica until distributed coordination is implemented and validated. Each scope requires ScheduledRequestJson matching its hash. Current limits: 32 configured scopes, 45 seconds per scope, two-minute periodic timer; sweeps are sequential and may overrun the timer. Avoid scheduling stale input repeatedly. Confirm SQL catalog routing, worker identity, and durable audit behavior before activation.

## Acceptance checklist

1. Run targeted collector, publisher, signer, catalog, lifecycle, vendor release, scheduler, identity, and execution tests.
2. Run disposable SQL journal and replay tests, including concurrent retries, cross-scope isolation, invalid digests and guarded rollback.
3. Test an authorized workload and foreign tenant, workspace, project and deployment denial; revoke a key and a worker grant during processing.
4. Confirm independently verified process version and prerequisite observations; incomplete observations must never imply protection.
5. Confirm a positive finding reaches the journal; inspect historical retrieval separately. Historical evidence is not current status. Missing evidence does not close findings.
6. Confirm production audit durability and retention. Structured logging alone is insufficient.
7. Keep API/UI exposure disabled until scoped contracts and authorization tests are complete.

## Rotation and recovery

Disable scheduling and quiesce publishers before changing deployment identity, spool ownership or trust configuration. Provision a new versioned signing key and independent public-key trust, verify a test signature, switch the per-scope key mapping, then revoke the retired key. Never copy private keys to application configuration.

For suspected compromise, disable the feature and revoke worker and signing grants. Preserve signed inputs, journal rows, audit records and SQL replay watermarks for investigation. Reprovision scope and keys only after review. A missing or rejected observation is unknown, not safe.

Back up the tenant catalog before recovery. Do not delete watermarks or journal evidence to restore service. Rollbacks R434/R435 intentionally refuse nonempty tables. Investigate failures using sanitized logs, CI and controlled forensic access; do not bypass authorization, signature checks or database integrity constraints.

## Residual limitations

The workload agent, live Azure effective-permission discovery, production findings UI, independently authenticated worker provisioning, distributed scheduling, and durable audit verification require further implementation or deployment validation. No production readiness is implied by source registration or a successful unit test.
