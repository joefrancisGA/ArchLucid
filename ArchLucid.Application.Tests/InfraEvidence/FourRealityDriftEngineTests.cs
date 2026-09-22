using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class FourRealityDriftEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid CurrentSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid PriorSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    private static readonly Guid SourcePathId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid StorageCloudResourceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid ChangeId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid DiffId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    private const string SubscriptionId = "55555555-5555-5555-5555-555555555555";
    private const string StorageArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

    [Fact]
    public async Task RunAsync_terraform_private_observed_public_emits_drift_path_and_finding()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: true,
            terraformPublicNetworkAccess: "disabled");

        InMemorySecurityEvidencePathRepository pathRepository = new();
        SeedPrivilegePath(pathRepository);

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        FourRealityDriftEngine sut = CreateEngine(
            scope,
            currentSnapshot,
            priorSnapshot: null,
            diffChanges: [],
            pathRepository,
            findingRepository);

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            CurrentSnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().Be(1);

        SecurityEvidencePathRecord driftPath = pathRepository.StoredPaths
            .Should()
            .ContainSingle(path => path.PathKind == PathKind.FourRealityDrift)
            .Subject;

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings.Should().ContainSingle().Subject;
        finding.PathId.Should().Be(driftPath.PathId);
        finding.Description.Should().Contain("Advisory Terraform mapping");
        finding.Description.Should().Contain("design-control drift");
    }

    [Fact]
    public async Task RunAsync_identical_realities_emits_none()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: false,
            terraformPublicNetworkAccess: "disabled");

        InMemorySecurityEvidencePathRepository pathRepository = new();
        SeedPrivilegePath(pathRepository);

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        FourRealityDriftEngine sut = CreateEngine(
            scope,
            currentSnapshot,
            priorSnapshot: BuildSnapshot(
                PriorSnapshotId,
                enablePublicNetworkAccess: false,
                terraformPublicNetworkAccess: "disabled"),
            diffChanges: [],
            pathRepository,
            findingRepository);

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            CurrentSnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().Be(0);
        pathRepository.StoredPaths.Should().NotContain(path => path.PathKind == PathKind.FourRealityDrift);
        findingRepository.StoredFindings.Should().BeEmpty();
    }

    [Fact]
    public async Task RunAsync_without_diagram_uses_temporal_diff_and_cites_change_id()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel currentSnapshot = BuildSnapshot(
            CurrentSnapshotId,
            enablePublicNetworkAccess: true,
            terraformPublicNetworkAccess: null);
        AzureInventorySnapshotDetailReadModel priorSnapshot = BuildSnapshot(
            PriorSnapshotId,
            enablePublicNetworkAccess: false,
            terraformPublicNetworkAccess: null);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        SeedPrivilegePath(pathRepository);

        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        FourRealityDriftEngine sut = CreateEngine(
            scope,
            currentSnapshot,
            priorSnapshot,
            diffChanges:
            [
                new AzureInventoryChangeRecord
                {
                    ChangeId = ChangeId,
                    DiffId = DiffId,
                    SnapshotAId = PriorSnapshotId,
                    SnapshotBId = CurrentSnapshotId,
                    CloudResourceId = StorageCloudResourceId,
                    ChangeType = AzureInventoryChangeType.NetworkExposureChanged,
                    Property = "enablePublicNetworkAccess",
                    OldValue = "false",
                    NewValue = "true",
                },
            ],
            pathRepository,
            findingRepository);

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            CurrentSnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().Be(1);

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings.Should().ContainSingle().Subject;
        finding.Description.Should().Contain($"ChangeId={ChangeId:D}");
        finding.InventoryDiffId.Should().Be(DiffId);
    }

    private static void SeedPrivilegePath(InMemorySecurityEvidencePathRepository pathRepository)
    {
        DateTime utcNow = DateTime.UtcNow;
        List<SecurityEvidencePathHopRecord> hops =
        [
            new SecurityEvidencePathHopRecord
            {
                HopRowId = Guid.NewGuid(),
                PathId = SourcePathId,
                TenantId = TenantId,
                HopOrdinal = 1,
                FromNodeId = "principal:owner",
                ToNodeId = StorageArm,
                EdgeType = GraphEdgeTypes.CanWrite,
                ProvenanceKind = ProvenanceKind.ObservedFact,
                HopConfidenceBand = PathConfidenceBand.Confirmed,
                EvidenceReference = "test:write",
                CloudResourceId = StorageCloudResourceId,
            },
        ];

        SecurityEvidencePathRecord header = new()
        {
            PathId = SourcePathId,
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
            SnapshotId = CurrentSnapshotId,
            PathKind = PathKind.Privilege,
            PathConfidenceBand = PathConfidenceBand.Confirmed,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        SecurityEvidencePathGuard.ValidatedPath validated =
            SecurityEvidencePathGuard.ValidateAndMaterialize(header, hops);

        pathRepository.StoredPaths.Add(validated.Path);
        pathRepository.StoredHops.AddRange(validated.Hops);
    }

    private static FourRealityDriftEngine CreateEngine(
        ScopeContext scope,
        AzureInventorySnapshotDetailReadModel currentSnapshot,
        AzureInventorySnapshotDetailReadModel? priorSnapshot,
        IReadOnlyList<AzureInventoryChangeRecord> diffChanges,
        InMemorySecurityEvidencePathRepository pathRepository,
        InMemoryOperationalSecurityFindingRepository findingRepository)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, CurrentSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(currentSnapshot);

        if (priorSnapshot is not null)
        {
            snapshotRepository
                .Setup(repository => repository.TryGetPriorMaterializedSnapshotIdAsync(
                    scope,
                    SubscriptionId,
                    CurrentSnapshotId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(PriorSnapshotId);

            snapshotRepository
                .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, PriorSnapshotId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(priorSnapshot);
        }

        Mock<IAzureInventoryDiffRepository> diffRepository = new();

        if (priorSnapshot is not null)
        {
            diffRepository
                .Setup(repository => repository.TryGetBySnapshotPairAsync(
                    scope,
                    PriorSnapshotId,
                    CurrentSnapshotId,
                    It.IsAny<CancellationToken>()))
                .ReturnsAsync(new AzureInventoryDiffSummaryRecord
                {
                    DiffId = DiffId,
                    SnapshotAId = PriorSnapshotId,
                    SnapshotBId = CurrentSnapshotId,
                    SubscriptionId = SubscriptionId,
                });

            diffRepository
                .Setup(repository => repository.ListChangesByDiffIdAsync(scope, DiffId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(diffChanges);
        }

        Mock<IArchitectureDiagramReconciliationRepository> reconciliationRepository = new();
        reconciliationRepository
            .Setup(repository => repository.ListRunIdsBySnapshotAsync(scope.TenantId, CurrentSnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        return new FourRealityDriftEngine(
            snapshotRepository.Object,
            diffRepository.Object,
            reconciliationRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<FourRealityDriftEngine>.Instance);
    }

    private static OperationalSecurityFindingIngestService CreateIngestService(
        InMemoryOperationalSecurityFindingRepository repository)
    {
        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return new OperationalSecurityFindingIngestService(
            repository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        bool enablePublicNetworkAccess,
        string? terraformPublicNetworkAccess)
    {
        Guid storageRowId = Guid.NewGuid();
        List<AzureInventoryResourcePropertyReadModel> properties =
        [
            new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = storageRowId,
                PropertyKey = "enablePublicNetworkAccess",
                PropertyValue = enablePublicNetworkAccess ? "true" : "false",
            },
        ];

        if (!string.IsNullOrWhiteSpace(terraformPublicNetworkAccess))
        {
            properties.Add(new AzureInventoryResourcePropertyReadModel
            {
                ResourceRowId = storageRowId,
                PropertyKey = "tf.public_network_access",
                PropertyValue = terraformPublicNetworkAccess,
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                ProjectId = ProjectId,
                SubscriptionId = SubscriptionId,
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = storageRowId,
                    SnapshotId = snapshotId,
                    TenantId = TenantId,
                    AzureResourceId = StorageArm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = StorageCloudResourceId,
                },
            ],
            Properties = properties,
        };
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private sealed class InMemorySecurityEvidencePathRepository : ISecurityEvidencePathRepository
    {
        public List<SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public List<SecurityEvidencePathHopRecord> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            SecurityEvidencePathRecord? match = StoredPaths.FirstOrDefault(path =>
                path.TenantId == tenantId && path.PathId == pathId);

            return Task.FromResult(match);
        }

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default)
            => Task.FromResult<SecurityEvidencePathRecord?>(null);

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> hops = StoredHops
                .Where(hop => hop.TenantId == tenantId && hop.PathId == pathId)
                .OrderBy(static hop => hop.HopOrdinal)
                .ToList();

            return Task.FromResult(hops);
        }

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default)
        {
            SecurityEvidencePathGuard.ValidatedPath validated =
                SecurityEvidencePathGuard.ValidateAndMaterialize(pathHeader, hops);

            SecurityEvidencePathRecord? existing = StoredPaths.FirstOrDefault(path =>
                path.TenantId == validated.Path.TenantId
                && path.SnapshotId == validated.Path.SnapshotId
                && path.CanonicalHopHashSha256.SequenceEqual(validated.Path.CanonicalHopHashSha256));

            if (existing is not null)
            {
                return Task.FromResult(new SecurityEvidencePathInsertResult
                {
                    PathId = existing.PathId,
                    Created = false,
                });
            }

            StoredPaths.Add(validated.Path);
            StoredHops.AddRange(validated.Hops);

            return Task.FromResult(new SecurityEvidencePathInsertResult
            {
                PathId = validated.Path.PathId,
                Created = true,
            });
        }

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord>, int)>(([], 0));

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<SecurityEvidencePathRecord> paths = StoredPaths
                .Where(path =>
                    path.TenantId == tenantId
                    && path.WorkspaceId == workspaceId
                    && path.ProjectId == projectId
                    && path.SnapshotId == snapshotId)
                .ToList();

            return Task.FromResult(paths);
        }
    }

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId
                && finding.Provider == provider
                && finding.SourceSystem == sourceSystem
                && finding.SourceFindingId == sourceFindingId);

            return Task.FromResult(match);
        }

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(StoredFindings);

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
            => Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord>, int)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<Guid>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default)
            => Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
        {
            StoredFindings.Add(finding);

            return Task.CompletedTask;
        }

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
