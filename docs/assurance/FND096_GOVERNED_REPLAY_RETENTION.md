> **Scope:** FND-096 governed artifact availability, read-only restoration and fixture evidence. No production retention schedule, legal-hold administrator policy or historical replay execution is enabled here.

# Governed historical replay retention

FND-094 pins exact artifact bytes, source scope and stage/attempt lineage. FND-096 intersects those requirements with a separately approved, versioned project retention matrix. A configured row names the replay mode and artifact role, maximum age, archive eligibility, and exact-raw or derived handling. Independent witnesses bind the current grant, policy revision, authorized placement, artifact lifecycle, original hard expiry, durability and erasure-index coverage. No omitted or revoked rule authorizes an artifact read.

## Reuse and lifecycle

| Existing boundary | How it is used |
| --- | --- |
| Authority bundles and captured SecureNow evidence | The FND-094 scoped artifact-reader path is the primary/recovery adapter boundary. Preserve authority manifest and snapshot identities. A reviewed adapter, not a caller URI, resolves the recorded artifact. |
| Historical AI traces and regional storage | Current tenant region and independently attested effective store region, encryption at rest and replay purpose must match. Use existing forensic authorization and prompt redaction. A typed result can be eligible independently of raw bytes; a redacted copy or inline truncated trace does not become exact. |
| Checkpoints and intermediate caches | Durable retention is explicitly required before any retained bytes are released. The descriptor ignores an evicted optional cache; if the checkpoint is required, an optional cache cannot satisfy it. |
| Tenant erasure and legal holds | Use the existing uncached tenant lifecycle lookup on every authorization check. Tenant quarantine or suspension denies reads, even when held. An artifact hold can preserve a copy for authorized handling without lifting the read expiry or an erasure approval. Existing erasure/retention owners retain scheduling and deletion authority. |
| Existing append-only audit | Record a scoped, opaque completed-erasure marker only when the owning erasure process and retention policy permit. Marker identity is stable across reclassification and run references to the same scoped artifact id. Record verified-for-use events without raw payloads, locators or policy secrets. Durable audit failure withholds any staged bytes. |

A current decision source must guarantee continuous marker coverage through the last possibly accessible primary, recovery or cached copy. The SQL lookup uses the scoped primary and committed reads, not the audit list cache or replica. Unsupported backends cannot claim a negative marker check. With incomplete index coverage, no active project/grant, unknown lifecycle, non-durable storage, missing placement, or stale policy, the reader stops. Artifact metadata must not re-enable an erasure completed in the existing authority. A hold controls preservation only. An explicit erase approval denies reads before completion; a recorded completion is reported as erased. Archived bytes do not restart the retention clock. Both the original age limit and hard expiry must still permit reading.

## Restore and assessment

Only an authorized missing primary can use a separately attested archive, when the rule allows it. Tampered, incompatible, redacted, unauthorized and erased inputs never silently fall back. The restore reader stages bounded bytes, compares the original project/run identity, role, schema, stage and attempt, length, and the original FND-094 SHA-256. It rechecks the current decision, scope and erasure journal before fallback, after staging, and after durable audit, before releasing bytes. This is a request-scoped recovery read. It never repopulates primary storage or overwrites the historical chain. Bytes already returned under an earlier valid authorization cannot be recalled.

The governed reader feeds the unmodified FND-094 readiness logic. Its output distinguishes exact from unknown, missing, derived, redacted, truncated, expired, erased, tampered and incompatible content. It does not substitute new inputs. The adapter for fresh artifact grants and placement/marker coverage must be wired to the existing authoritative controls before production adoption; this slice does not assert that all existing product stores supply those receipts or deploy a TTL, purge, backup, or scheduler.

## Reproduce the evidence

```bash
FND096_RESTORE_EVIDENCE=/tmp/fnd096-restore.json \
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj -c Release \
  --filter 'FullyQualifiedName~HistoricalReplayRetentionTests'
```

The focused lane includes FND-094 and adjacent product replay tests. The non-memory restore fixture writes a real encrypted envelope through the existing scoped local-file blob store and retrieves the original bytes through the governed archive path. The report records the elapsed microseconds, archive reads, original payload bytes and encrypted stored bytes. Optional `FND096_USD_PER_GIB_MONTH` estimates one fixture object's monthly storage at an explicitly supplied rate; without a rate the report records unknown pricing. This is not a provider bill, nor a verification of production Azure encryption, residency, backup configuration or lifecycle scheduling. FND-095 owns restricted execution and FND-097 owns independent historical equivalence.
