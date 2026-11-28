> **Scope:** Contributor reference for FND-085 calibration and the optional-artifact pilot. It is not a production retention policy or a statement that optional artifact writes are enabled.

# FND-085 selective intermediate materialization

The first decision is whether a result can be disposed of without losing recovery, audit, or historical evidence. Savings cannot override that classification.

| Area | Keep under the existing recovery and evidence contracts | Optional candidates for measurement |
| --- | --- | --- |
| Authority | Context, graph and findings outputs required by a completed checkpoint, the atomic decision/artifact/publication group, sealed manifests and receipts, superseded checkpoint and audit history | Recomputable graph merge or display derivatives that are not referenced by an authoritative checkpoint |
| SecureNow | Accepted capture and chosen plan, required path and drift output witnesses, scoped ranking/cut-point/routing outputs referenced by the job, final receipt and audit history | The inventory diagram projection built from an already authorized, pinned inventory snapshot |
| Both | Any output subject to applicable evidence retention, audit or erasure requirements | Only derivatives that can be reproduced from the exact compatible inputs within the remaining run budget |

This split follows [FND-075](FND075_DURABLE_ANALYSIS_RECOVERY.md) and [FND-076](FND076_DEPENDENCY_AWARE_ANALYSIS_REUSE.md). The existing graph projection cache already handles eligible query hydration. Do not repurpose its keys for stage artifacts or add a competing store. A necessary output does not become optional because a similar preview is cheap to rebuild.

## Decision rule

For an optional output, compare estimated net savings using one calibrated cost unit over one retention window:

`expected valid hits × (recompute cost − validated read cost) − encode/write cost − retention cost`

Include reads that can actually hit within the allowed window. Include the cost of validation and decoding in a read. Use the existing budget and retention authorities for entry size, available aggregate capacity and lifetime. Reject unknown or inconsistent economics, arithmetic overflow, nonpositive savings, and outputs that are required or outside the bounds. A favorable estimate identifies a candidate. It does not authorize a write or claim a customer saving.

The pilot uses the existing graph projection serializer and local artifact provider. The independently held reference binds the format, exact scoped execution and stage, input version, producer build, byte length, SHA-256 digest, and expiration. A cached value is not a required output, cannot prove a stage completed, and cannot grant access. Authorization, valid checkpoint lineage, and visibility are caller prerequisites. Compare exact dependency witnesses from [FND-083](https://github.com/joefrancisGA/ArchLucid/pull/8358) once available, not a resemblance between output summaries.

## Reproduce the pilot

Run the two default-off measurement workloads in a dedicated local test invocation. Set `FND085_PILOT_OUTPUT_DIR` to collect one compact JSON row per product and size.

```sh
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj -c Release \
  -p:TreatWarningsAsErrors=true --settings test.runsettings \
  --filter 'FullyQualifiedName~IntermediateMaterialization|FullyQualifiedName~OptionalIntermediateArtifact'
```

The four cohorts use synthetic graph data only. The harness warms each workload once, then records median fresh recomputation, encode and write, and read, identity and digest validation, and decode latency over nine iterations. It compares the decoded result to a fresh recomputation. The optimistic break-even calculation assigns no cost to retention solely as a lower bound. It is not a calibrated policy input. A local filesystem with OS page caching is not a SQL, Azure Blob, or Redis workload. Do not read these results as production latency, reuse frequency, capacity, or cost.

## Pilot decision

On November 28, 2026 (x64 Linux, .NET 10, Release), three test-process runs produced the following medians of their per-run medians. Sizes are the bytes written by the local text provider, including the binary-to-text encoding. The first invocation passed all 11 focused tests. Both repeats passed the four measurement cases.

| Workload | Nodes | Stored bytes | Recompute ms | Encode/write ms | Read/validate/decode ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Authority knowledge graph merge | 256 | 38,040 | 0.36 | 2.17 | 5.39 |
| Authority knowledge graph merge | 2,048 | 295,772 | 3.20 | 15.82 | 45.36 |
| SecureNow inventory diagram projection | 256 | 44,864 | 3.67 | 3.40 | 5.18 |
| SecureNow inventory diagram projection | 2,048 | 352,892 | 46.87 | 17.54 | 43.63 |

Reads lost to recomputation on all three runs for both Authority sizes and the smaller SecureNow projection. The larger SecureNow projection lost on one run and needed at least three or twelve hits on the other two runs, respectively, to recover the write latency even before accounting for storage or remote I/O. It is the only candidate worth calibrating further. **Do not enable new persistence for either pilot workload on this evidence.** The next gate for the larger SecureNow candidate is observed valid hit frequency on representative authorized captures and cost from the intended provider.

## Runtime acceptance before any write rollout

1. Measure realistic reuse and storage/retention charges per candidate in an authorized isolated environment. If there is no demonstrated benefit, leave writes disabled.
2. Bind any accepted optional reference to the full scoped FND-083 witness in the canonical recovery path. Preserve required checkpoint transactions, attempts, deadlines, worker fences, authorization and sealed history. Never let a stale attempt publish a new optional reference.
3. Use existing authorized artifact storage and scoped retention/erasure controls. Enforce write availability and aggregate limits atomically. Publish the reference after the bytes are durable. Verify duplicate writes, same-input redelivery, partial writes, and race-safe cleanup of unreferenced objects.
4. Observe save/reuse/recompute reasons in shadow mode without writing artifacts. Collect costs, bytes and validated hits without raw evidence, identifiers with unbounded metric cardinality, or payload content. Compare against a fresh stable computation on the same pinned inputs.
5. Make a missing, evicted, corrupt, expired, or incompatible optional value a miss. Recompute only when the original compatible execution and budget permit it. A missing required checkpoint output still follows fail-closed recovery. Never replace a pinned SecureNow plan in place.
6. Verify the exact integrated build with disposable SQL and the selected existing backing store. Check restart and interrupted write recovery, concurrent cleanup and reads, eviction under pressure, deployment rollback, compatible and incompatible producer versions, independent result equivalence, and full cost and latency. Limit rollout to approved workloads only. Disabling optional writes must leave existing required recovery and historical evidence intact.

Neither this pilot nor its policy tests add a deployed persistence or cleanup path, change retention configuration, or enable optional writes.
