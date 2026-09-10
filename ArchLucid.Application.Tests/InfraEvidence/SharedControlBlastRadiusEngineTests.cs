using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SharedControlBlastRadiusEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("a8a8a8a8-a8a8-a8a8-a8a8-a8a8a8a8a8a8");
    private static readonly Guid WorkspaceId = Guid.Parse("a9a9a9a9-a9a9-a9a9-a9a9-a9a9a9a9a9a9");
    private static readonly Guid ProjectId = Guid.Parse("aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid SnapshotId = Guid.Parse("aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";
    private const string SharedManagedIdentityArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/shared-mi";
    private const string UniqueManagedIdentityArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/unique-mi";
    private const string StorageArm1 =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string StorageArm2 =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa2";
    private const string StorageArm3 =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa3";
    private const string ManagementGroupScope = "/providers/Microsoft.Management/managementGroups/corp";
    private const string PolicyDefinitionArm =
        "/providers/Microsoft.Authorization/policyDefinitions/require-tag";

    [Fact]
    public async Task RunAsync_shared_managed_identity_on_three_storage_accounts_emits_blast_radius_finding()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildSharedManagedIdentitySnapshot();

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        SharedControlBlastRadiusEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            CreateIngestService(findingRepository));

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().BeGreaterThan(0);
        result.FindingsIngested.Should().BeGreaterThan(0);

        SecurityEvidencePathRecord path = pathRepository.StoredPaths
            .Should()
            .ContainSingle(storedPath => storedPath.PathKind == PathKind.SharedControlBlastRadius)
            .Subject;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(TenantId, path.PathId, CancellationToken.None);

        hops.Should().HaveCount(3);
        hops.Should().OnlyContain(hop =>
            hop.EdgeType == SecureNowArchitectConstants.SharedControlFanOutHopEdgeType
            && hop.ProvenanceKind == ProvenanceKind.ObservedFact);

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings
            .Should()
            .ContainSingle(storedFinding => storedFinding.PathId == path.PathId)
            .Subject;

        finding.Title.Should().Contain("shared-mi");
        finding.Title.Should().Contain("3 dependents");
        finding.Description.Should().Contain("Centralization improves consistency and increases correlated failure");
        finding.Description.Should().NotContain("centralization is unsafe");
    }

    [Fact]
    public async Task RunAsync_unique_managed_identity_per_resource_produces_no_shared_control_finding()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildUniqueManagedIdentitySnapshot();

        InMemorySecurityEvidencePathRepository pathRepository = new();
        SharedControlBlastRadiusEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            CreateIngestService(new InMemoryOperationalSecurityFindingRepository()));

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().Be(0);
        pathRepository.StoredPaths.Should().NotContain(path => path.PathKind == PathKind.SharedControlBlastRadius);
    }

    [Fact]
    public async Task RunAsync_management_group_policy_assignment_counts_snapshot_dependents()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildManagementGroupPolicySnapshot();

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        SharedControlBlastRadiusEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            CreateIngestService(findingRepository));

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings
            .Should()
            .ContainSingle(storedFinding =>
                storedFinding.ControlId == SecureNowArchitectConstants.SharedControlBlastRadiusControlId)
            .Subject;

        findingRepository.StoredMetadata.Should().Contain(metadata =>
            metadata.FindingId == finding.FindingId
            && metadata.MetadataKey == "dependentCount"
            && metadata.MetadataValue == "3");
        findingRepository.StoredMetadata.Should().Contain(metadata =>
            metadata.FindingId == finding.FindingId
            && metadata.MetadataKey == "sharedControlKind"
            && metadata.MetadataValue == SharedControlBlastRadiusControlKind.BroadScopePolicyAssignment.ToString());
    }

    [Fact]
    public async Task RunAsync_second_run_deduplicates_findings()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildSharedManagedIdentitySnapshot();

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        SharedControlBlastRadiusEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            CreateIngestService(findingRepository));

        PrivilegePathEngineResult first = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        PrivilegePathEngineResult second = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        first.FindingsIngested.Should().BeGreaterThan(0);
        second.FindingsDeduplicated.Should().Be(first.PathsDiscovered);
    }

    [Fact]
    public void SharedControlBlastRadiusEngine_is_not_a_finding_engine_plugin()
    {
        typeof(SharedControlBlastRadiusEngine).Should().NotImplement<IFindingEngine>();
        typeof(SharedControlBlastRadiusEngine).Should().NotImplement<IEffectfulFindingEngine>();
    }

    private static AzureInventorySnapshotDetailReadModel BuildSharedManagedIdentitySnapshot() =>
        new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(SharedManagedIdentityArm, "Microsoft.ManagedIdentity/userAssignedIdentities", Guid.NewGuid()),
                Resource(StorageArm1, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
                Resource(StorageArm2, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
                Resource(StorageArm3, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
            ],
            Relationships =
            [
                UsesIdentity(StorageArm1, SharedManagedIdentityArm),
                UsesIdentity(StorageArm2, SharedManagedIdentityArm),
                UsesIdentity(StorageArm3, SharedManagedIdentityArm),
            ],
        };

    private static AzureInventorySnapshotDetailReadModel BuildUniqueManagedIdentitySnapshot() =>
        new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(UniqueManagedIdentityArm, "Microsoft.ManagedIdentity/userAssignedIdentities", Guid.NewGuid()),
                Resource(
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/other-mi",
                    "Microsoft.ManagedIdentity/userAssignedIdentities",
                    Guid.NewGuid()),
                Resource(StorageArm1, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
                Resource(StorageArm2, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
            ],
            Relationships =
            [
                UsesIdentity(StorageArm1, UniqueManagedIdentityArm),
                UsesIdentity(
                    StorageArm2,
                    "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/other-mi"),
            ],
        };

    private static AzureInventorySnapshotDetailReadModel BuildManagementGroupPolicySnapshot() =>
        new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(StorageArm1, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
                Resource(StorageArm2, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
                Resource(StorageArm3, "Microsoft.Storage/storageAccounts", Guid.NewGuid()),
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = PolicyDefinitionArm,
                    ToAzureResourceId = ManagementGroupScope,
                    RelationshipType = GraphEdgeTypes.AppliesTo,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

    private static AzureInventoryResourceRelationshipReadModel UsesIdentity(string resourceArm, string identityArm) =>
        new()
        {
            FromAzureResourceId = resourceArm,
            ToAzureResourceId = identityArm,
            RelationshipType = GraphEdgeTypes.UsesIdentity,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };

    private static AzureInventoryResourceRecord Resource(string armId, string resourceType, Guid rowId) =>
        new()
        {
            ResourceRowId = rowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = armId,
            ResourceType = resourceType,
            CloudResourceId = Guid.NewGuid(),
        };

    private static SharedControlBlastRadiusEngine CreateEngine(
        AzureInventorySnapshotDetailReadModel snapshot,
        ScopeContext scope,
        InMemorySecurityEvidencePathRepository pathRepository,
        OperationalSecurityFindingIngestService ingestService)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return new SharedControlBlastRadiusEngine(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<SharedControlBlastRadiusEngine>.Instance);
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

    private static AzureInventorySnapshotRecord CreateHeader() =>
        new()
        {
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            SubscriptionId = SubscriptionId,
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
        };

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
        {
            SecurityEvidencePathRecord? match = StoredPaths.FirstOrDefault(path =>
                path.TenantId == tenantId
                && path.SnapshotId == snapshotId
                && path.CanonicalHopHashSha256.SequenceEqual(canonicalHopHashSha256));

            return Task.FromResult(match);
        }

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
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>((StoredPaths, StoredPaths.Count));
    }

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public List<OperationalSecurityFindingMetadataRecord> StoredMetadata { get; } = [];

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
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(StoredFindings.ToList());

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>(
                StoredMetadata.Where(metadata => metadata.TenantId == tenantId && metadata.FindingId == findingId).ToList());

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
        {
            StoredFindings.Add(finding);
            StoredMetadata.AddRange(metadata);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
