using System.Diagnostics;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.AzureExtractor;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlSecurityEvidencePathRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid TenantA = Guid.Parse("b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1");
    private static readonly Guid TenantB = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid WorkspaceId = Guid.Parse("b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3");
    private static readonly Guid ProjectId = Guid.Parse("b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4");

    [SkippableFact]
    public async Task Snapshot_read_rejects_other_tenant_project_and_snapshot()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);
        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();

        await repository.InsertIfNotExistsAsync(
            CreatePathHeader(pathId, TenantA, snapshotId, DateTime.UtcNow),
            CreateHops(pathId, TenantA, PathConfidenceBand.Confirmed),
            CancellationToken.None);

        ProjectScopeKey project = ProjectScopeKey.Create(TenantA, WorkspaceId, ProjectId);
        ProjectSnapshotScopeKey correct = ProjectSnapshotScopeKey.Create(project, snapshotId);
        ProjectSnapshotScopeKey wrongTenant = ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(TenantB, WorkspaceId, ProjectId), snapshotId);
        ProjectSnapshotScopeKey wrongProject = ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(TenantA, WorkspaceId, Guid.NewGuid()), snapshotId);
        ProjectSnapshotScopeKey wrongSnapshot = ProjectSnapshotScopeKey.Create(project, Guid.NewGuid());

        (await repository.ListBySnapshotAsync(correct)).Select(path => path.PathId).Should().Contain(pathId);
        (await repository.ListBySnapshotAsync(wrongTenant)).Should().BeEmpty();
        (await repository.ListBySnapshotAsync(wrongProject)).Should().BeEmpty();
        (await repository.ListBySnapshotAsync(wrongSnapshot)).Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Duplicate_canonical_hash_is_idempotent_and_tenant_isolated()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);

        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        SecurityEvidencePathRecord header = CreatePathHeader(pathId, TenantA, snapshotId, utcNow);
        IReadOnlyList<SecurityEvidencePathHopRecord> hops = CreateHops(pathId, TenantA, PathConfidenceBand.HighlyLikely);

        SecurityEvidencePathInsertResult first = await repository.InsertIfNotExistsAsync(header, hops, CancellationToken.None);
        first.Created.Should().BeTrue();
        first.PathId.Should().Be(pathId);

        SecurityEvidencePathInsertResult second = await repository.InsertIfNotExistsAsync(
            CreatePathHeader(Guid.NewGuid(), TenantA, snapshotId, utcNow),
            hops,
            CancellationToken.None);

        second.Created.Should().BeFalse();
        second.PathId.Should().Be(pathId);

        SecurityEvidencePathRecord? foreignTenant = await repository.TryGetByIdAsync(TenantB, pathId, CancellationToken.None);
        foreignTenant.Should().BeNull("paths are tenant-isolated.");
    }

    [SkippableFact]
    public async Task Insert_persists_weakest_link_band_and_hops()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);

        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(pathId, TenantA, 1, PathConfidenceBand.Confirmed, ProvenanceKind.ObservedFact),
            CreateHop(pathId, TenantA, 2, PathConfidenceBand.Possible, ProvenanceKind.DerivedFact),
        ];

        await repository.InsertIfNotExistsAsync(
            CreatePathHeader(pathId, TenantA, snapshotId, utcNow),
            hops,
            CancellationToken.None);

        SecurityEvidencePathRecord? loaded = await repository.TryGetByIdAsync(TenantA, pathId, CancellationToken.None);
        loaded.Should().NotBeNull();
        loaded!.PathConfidenceBand.Should().Be(PathConfidenceBand.Possible);
        loaded.WeakestHopOrdinal.Should().Be(2);

        IReadOnlyList<SecurityEvidencePathHopRecord> loadedHops =
            await repository.ListHopsByPathAsync(TenantA, pathId, CancellationToken.None);

        loadedHops.Should().HaveCount(2);
        loadedHops.Select(static hop => hop.HopOrdinal).Should().BeEquivalentTo([1, 2], options => options.WithStrictOrdering());
    }

    [SkippableFact]
    public async Task Insert_rejects_ai_inference_confirmed_hop()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);

        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
        [
            CreateHop(pathId, TenantA, 1, PathConfidenceBand.Confirmed, ProvenanceKind.AiInference),
        ];

        Func<Task> act = () => repository.InsertIfNotExistsAsync(
            CreatePathHeader(pathId, TenantA, snapshotId, utcNow),
            hops,
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*LLM-inferred*Confirmed*");
    }

    [SkippableFact]
    public async Task Batch_insert_deduplicates_in_input_order_and_batch_read_enforces_scope()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);
        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;
        SecurityEvidencePathWithHops first = new(CreatePathHeader(pathId, TenantA, snapshotId, now),
            CreateHops(pathId, TenantA, PathConfidenceBand.Possible));
        Guid duplicateId = Guid.NewGuid();
        SecurityEvidencePathWithHops duplicate = new(CreatePathHeader(duplicateId, TenantA, snapshotId, now),
            CreateHops(duplicateId, TenantA, PathConfidenceBand.Possible));

        IReadOnlyList<SecurityEvidencePathInsertResult> inserted =
            await repository.InsertBatchIfNotExistsAsync([first, duplicate]);
        inserted.Select(result => result.PathId).Should().Equal(pathId, pathId);
        inserted.Select(result => result.Created).Should().Equal(true, false);
        (await repository.InsertBatchIfNotExistsAsync([first, duplicate])).Should().OnlyContain(result => !result.Created);

        ProjectScopeKey project = ProjectScopeKey.Create(TenantA, WorkspaceId, ProjectId);
        IReadOnlyList<SecurityEvidencePathWithHops> loaded = await repository.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(project, snapshotId));
        loaded.Should().ContainSingle();
        loaded[0].Hops.Select(hop => hop.HopOrdinal).Should().Equal(1, 2);
        loaded[0].Path.PathConfidenceBand.Should().Be(PathConfidenceBand.Possible);
        loaded[0].Path.CanonicalHopHashSha256.Should().Equal(SecurityEvidencePathCanonicalHash.ComputeSha256(first.Hops));
        (await repository.ListWithHopsBySnapshotAsync(ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(TenantB, WorkspaceId, ProjectId), snapshotId))).Should().BeEmpty();
        (await repository.ListWithHopsBySnapshotAsync(ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(TenantA, Guid.NewGuid(), ProjectId), snapshotId))).Should().BeEmpty();
        (await repository.ListWithHopsBySnapshotAsync(ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(TenantA, WorkspaceId, Guid.NewGuid()), snapshotId))).Should().BeEmpty();
        (await repository.ListWithHopsBySnapshotAsync(ProjectSnapshotScopeKey.Create(project, Guid.NewGuid()))).Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Failed_batch_rolls_back_headers_when_hops_violate_unique_ordinals()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);
        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        Guid pathId = Guid.NewGuid();
        Func<Task> insert = () => repository.InsertBatchIfNotExistsAsync(
        [
            new(CreatePathHeader(pathId, TenantA, snapshotId, DateTime.UtcNow),
            [
                CreateHop(pathId, TenantA, 1, PathConfidenceBand.Confirmed, ProvenanceKind.ObservedFact),
                CreateHop(pathId, TenantA, 1, PathConfidenceBand.Possible, ProvenanceKind.DerivedFact),
            ]),
        ]);
        await insert.Should().ThrowAsync<Microsoft.Data.SqlClient.SqlException>();
        (await repository.TryGetByIdAsync(TenantA, pathId)).Should().BeNull();
    }

    [SkippableFact]
    public async Task Batch_insert_preserves_every_path_and_hop_across_buffer_boundaries()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);
        Guid snapshotId = await InsertSnapshotAsync(factory, TenantA);
        DateTime now = DateTime.UtcNow;
        List<SecurityEvidencePathWithHops> writes = Enumerable.Range(0, 1001).Select(index =>
        {
            Guid pathId = Guid.NewGuid();
            return new SecurityEvidencePathWithHops(CreatePathHeader(pathId, TenantA, snapshotId, now),
            [
                new SecurityEvidencePathHopRecord
                {
                    HopRowId = Guid.NewGuid(), PathId = pathId, TenantId = TenantA, HopOrdinal = 1,
                    FromNodeId = $"principal-{index}", ToNodeId = $"resource-{index}", EdgeType = "can-read",
                    ProvenanceKind = ProvenanceKind.ObservedFact, HopConfidenceBand = PathConfidenceBand.Confirmed,
                    EvidenceReference = $"snapshot:{snapshotId:D}", InferenceSource = null, CloudResourceId = null,
                },
            ]);
        }).ToList();

        IReadOnlyList<SecurityEvidencePathInsertResult> inserted = await repository.InsertBatchIfNotExistsAsync(writes);
        inserted.Select(result => result.PathId).Should().Equal(writes.Select(item => item.Path.PathId));
        inserted.Should().OnlyContain(result => result.Created);
        ProjectSnapshotScopeKey benchmarkScope =
            ProjectSnapshotScopeKey.Create(ProjectScopeKey.Create(TenantA, WorkspaceId, ProjectId), snapshotId);
        // One batched repository call over 1,001 persisted path/hop pairs.
        // Measures SQL-backed read latency, not the full HTTP inspector request.
        Stopwatch readTimer = Stopwatch.StartNew();
        IReadOnlyList<SecurityEvidencePathWithHops> loaded =
            await repository.ListWithHopsBySnapshotAsync(benchmarkScope);
        readTimer.Stop();
        string measurement =
            $"SECURENOW_SQL_READ_BENCHMARK paths={writes.Count} hops={loaded.Sum(x => x.Hops.Count)} " +
            $"repository_calls=1 elapsed_ms={readTimer.Elapsed.TotalMilliseconds:F3} " +
            $"scope=sql-backed-batch-read (not inspector end-to-end, not SQL statement count)";
        Console.WriteLine(measurement);
        // xUnit's Console output may not be embedded in TRX. Persist the metric separately
        // when CI supplies an explicit output path, after the SQL read completes.
        string? measurementPath = Environment.GetEnvironmentVariable("SECURENOW_SQL_BENCHMARK_OUTPUT");
        if (!string.IsNullOrWhiteSpace(measurementPath))
        {
            string absolutePath = Path.GetFullPath(measurementPath);
            Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);
            await File.WriteAllTextAsync(absolutePath, measurement + Environment.NewLine);
        }
        loaded.Should().HaveCount(writes.Count);
        loaded.SelectMany(item => item.Hops).Should().HaveCount(writes.Count);
        loaded.Should().OnlyContain(item => item.Hops.Count == 1 && item.Hops[0].PathId == item.Path.PathId
            && item.Hops[0].InferenceSource == null && item.Hops[0].CloudResourceId == null);
    }


    [SkippableTheory]
    [InlineData(1000, 1)]
    [InlineData(2000, 4)]
    public async Task Benchmark_real_scoped_path_repository_reads(int pathCount, int concurrency)
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlSecurityEvidencePathRepository repository = new(factory);
        Guid snapshot = await InsertSnapshotAsync(factory, TenantA);
        DateTime now = DateTime.UtcNow;
        const int batchSize = 200;
        for (int offset = 0; offset < pathCount; offset += batchSize)
        {
            var batch = Enumerable.Range(offset, Math.Min(batchSize, pathCount - offset)).Select(index =>
            {
                Guid pathId = Guid.NewGuid();
                return new SecurityEvidencePathWithHops(
                    CreatePathHeader(pathId, TenantA, snapshot, now),
                    [new SecurityEvidencePathHopRecord
                    {
                        HopRowId = Guid.NewGuid(), PathId = pathId, TenantId = TenantA,
                        HopOrdinal = 1, FromNodeId = $"benchmark-principal-{index}",
                        ToNodeId = $"benchmark-resource-{index}", EdgeType = "can-read",
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                        HopConfidenceBand = PathConfidenceBand.Confirmed,
                        EvidenceReference = $"snapshot:{snapshot:D}"
                    }]);
            }).ToArray();
            var inserted = await repository.InsertBatchIfNotExistsAsync(batch);
            inserted.Should().OnlyContain(x => x.Created);
        }
        var scope = ProjectSnapshotScopeKey.Create(
            ProjectScopeKey.Create(TenantA, WorkspaceId, ProjectId), snapshot);
        const int samplesPerWorker = 5;
        long[] samples = new long[concurrency * samplesPerWorker];
        var warm = await repository.ListWithHopsBySnapshotAsync(scope);
        warm.Should().HaveCount(pathCount);
        using Process clientProcess = Process.GetCurrentProcess();
        clientProcess.Refresh();
        TimeSpan clientCpuBefore = clientProcess.TotalProcessorTime;
        long clientMemoryBefore = clientProcess.WorkingSet64;
        // SQL connection is test-only; server metrics may be inaccessible to non-sysadmin identities.
        // The query below is deliberately advisory and cannot isolate this test's server CPU.
        SqlInstanceCapacityObserver.Sample serverBefore = await SqlInstanceCapacityObserver.CaptureAsync(fixture.ConnectionString);
        DateTimeOffset benchmarkStartUtc = DateTimeOffset.UtcNow;
        Stopwatch overall = Stopwatch.StartNew();
        await Task.WhenAll(Enumerable.Range(0, concurrency).Select(async worker =>
        {
            for (int i = 0; i < samplesPerWorker; i++)
            {
                long start = Stopwatch.GetTimestamp();
                var result = await repository.ListWithHopsBySnapshotAsync(scope);
                long ticks = Stopwatch.GetTimestamp() - start;
                if (result.Count != pathCount) throw new InvalidOperationException("Incomplete scoped read");
                samples[worker * samplesPerWorker + i] = ticks;
            }
        }));
        overall.Stop();
        DateTimeOffset benchmarkEndUtc = DateTimeOffset.UtcNow;
        clientProcess.Refresh();
        double clientCpuMilliseconds = Math.Max(0, (clientProcess.TotalProcessorTime - clientCpuBefore).TotalMilliseconds);
        long clientMemoryAfter = clientProcess.WorkingSet64;
        SqlInstanceCapacityObserver.Sample serverAfter = await SqlInstanceCapacityObserver.CaptureAsync(fixture.ConnectionString);
        // DMV totals span the entire instance and may decrease after plan-cache eviction.
        long? queryCpuDelta = serverBefore.CpuMilliseconds.HasValue && serverAfter.CpuMilliseconds.HasValue &&
            serverAfter.CpuMilliseconds.Value >= serverBefore.CpuMilliseconds.Value
            ? serverAfter.CpuMilliseconds.Value - serverBefore.CpuMilliseconds.Value : null;
        string? root = Environment.GetEnvironmentVariable("ARCHLUCID_CAPACITY_BENCH_OUTPUT");
        if (string.IsNullOrWhiteSpace(root)) return;
        Directory.CreateDirectory(root);
        double[] sorted = samples.Select(t => t * 1000d / Stopwatch.Frequency).Order().ToArray();
        var report = new
        {
            schemaVersion = 1, backend = "SQL_SECURITY_EVIDENCE_PATH_REPOSITORY",
            pathCount, hopsPerPath = 1, concurrency, queries = samples.Length,
            elapsedSeconds = overall.Elapsed.TotalSeconds,
            measurementStartUtc = benchmarkStartUtc,
            measurementEndUtc = benchmarkEndUtc,
            p50Milliseconds = sorted[(sorted.Length - 1) / 2],
            p95Milliseconds = sorted[(int)Math.Ceiling(sorted.Length * .95) - 1],
            clientProcessCpuMillisecondsDelta = clientCpuMilliseconds,
            clientWorkingSetBeforeBytes = clientMemoryBefore,
            clientWorkingSetAfterBytes = clientMemoryAfter,
            serverCachedQueryWorkerCpuMillisecondsDelta = queryCpuDelta,
            serverCachedQueryWorkerCpuBeforeMilliseconds = serverBefore.CpuMilliseconds,
            serverCachedQueryWorkerCpuAfterMilliseconds = serverAfter.CpuMilliseconds,
            serverInstancePhysicalMemoryBeforeKb = serverBefore.PhysicalMemoryKb,
            serverInstancePhysicalMemoryAfterKb = serverAfter.PhysicalMemoryKb,
            serverInstanceCommittedMemoryBeforeKb = serverBefore.CommittedMemoryKb,
            serverInstanceCommittedMemoryAfterKb = serverAfter.CommittedMemoryKb,
            serverInstanceEvidenceBefore = serverBefore.EvidenceStatus,
            serverInstanceEvidenceAfter = serverAfter.EvidenceStatus,
            resourceEvidenceStatus = "PROCESS_WIDE_SQL_INSTANCE_WIDE_NOT_ISOLATED",
            limitations = "CPU includes concurrent activity in the test and SQL Server processes; working set is only before/after, not peak. SQL instance memory DMV may be inaccessible; SQL CPU is cached completed-query worker time, instance-wide and potentially affected by plan eviction; null is not zero. Not calibrated worker or SQL tier demand."
        };
        await File.WriteAllTextAsync(Path.Combine(root, $"sql-repository-{pathCount}-{concurrency}.json"),
            System.Text.Json.JsonSerializer.Serialize(report, new System.Text.Json.JsonSerializerOptions { WriteIndented = true }));
    }

    private static async Task<Guid> InsertSnapshotAsync(SqlConnectionFactory factory, Guid tenantId)
    {
        SqlAzureExtractorPackageRepository packageRepository = new(factory);
        SqlAzureInventorySnapshotRepository snapshotRepository = new(factory);

        Guid packageId = Guid.NewGuid();
        DateTime utcNow = DateTime.UtcNow;

        await packageRepository.InsertAsync(
            new AzureExtractorPackageRecord
            {
                PackageId = packageId,
                TenantId = tenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                CreatedUtc = utcNow,
                SchemaVersion = 1,
                OriginalFileName = "inventory.zip",
                ManifestJson = "{}",
                PackageBytes = [0x50, 0x4B],
            },
            CancellationToken.None);

        Guid snapshotId = Guid.NewGuid();
        await snapshotRepository.InsertHeaderAsync(
            new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = tenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                PackageId = packageId,
                CaptureStatus = AzureInventoryCaptureStatus.Pending,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            },
            CancellationToken.None);

        return snapshotId;
    }

    private static SecurityEvidencePathRecord CreatePathHeader(
        Guid pathId,
        Guid tenantId,
        Guid snapshotId,
        DateTime utcNow) =>
        new()
        {
            PathId = pathId,
            TenantId = tenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = snapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static IReadOnlyList<SecurityEvidencePathHopRecord> CreateHops(
        Guid pathId,
        Guid tenantId,
        PathConfidenceBand band) =>
    [
        CreateHop(pathId, tenantId, 1, band, ProvenanceKind.ObservedFact),
        CreateHop(pathId, tenantId, 2, band, ProvenanceKind.DerivedFact),
    ];

    private static SecurityEvidencePathHopRecord CreateHop(
        Guid pathId,
        Guid tenantId,
        int hopOrdinal,
        PathConfidenceBand band,
        ProvenanceKind provenance) =>
        new()
        {
            HopRowId = Guid.NewGuid(),
            PathId = pathId,
            TenantId = tenantId,
            HopOrdinal = hopOrdinal,
            FromNodeId = $"actor-{hopOrdinal}",
            ToNodeId = $"resource-{hopOrdinal}",
            EdgeType = "privilege-assignment",
            ProvenanceKind = provenance,
            HopConfidenceBand = band,
            EvidenceReference = $"/subscriptions/sub/roleAssignments/{hopOrdinal}",
        };
}
