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
public sealed class PrivilegePathEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1");
    private static readonly Guid WorkspaceId = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2");
    private static readonly Guid ProjectId = Guid.Parse("e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3");
    private static readonly Guid SnapshotId = Guid.Parse("f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1");

    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";
    private const string StorageAccountArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ManagedIdentityArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker";
    private const string UserPrincipalId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private const string ManagedIdentityPrincipalId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string BlobReaderRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/2a2b9908-6ea1-4ae2-8e65-a410df84e7dd";

    [Fact]
    public async Task RunAsync_managed_identity_blob_reader_path_persists_path_and_finding_with_path_id()
    {
        Guid storageRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        ScopeContext scope = CreateScope();

        AzureInventorySnapshotDetailReadModel snapshot = BuildManagedIdentityBlobReaderSnapshot(
            storageRowId,
            managedIdentityRowId);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            ingestService);

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().BeGreaterThan(0);
        result.PathsPersisted.Should().BeGreaterThan(0);
        result.FindingsIngested.Should().BeGreaterThan(0);

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings
            .Single(f => f.Description?.Contains("managed identity", StringComparison.Ordinal) == true);
        finding.SourceSystem.Should().Be(SecureNowArchitectConstants.SourceSystem);
        finding.PathId.Should().NotBeNull();
        finding.Title.Should().StartWith("Privilege path:");
        finding.Title.Should().Contain("read access");
        finding.Description.Should().Contain("USES_IDENTITY");

        SecurityEvidencePathRecord path = pathRepository.StoredPaths.Should()
            .ContainSingle(p => p.PathId == finding.PathId)
            .Subject;
        path.PathKind.Should().Be(PathKind.Privilege);
        path.SnapshotId.Should().Be(SnapshotId);

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(TenantId, path.PathId, CancellationToken.None);

        hops.Should().NotBeEmpty();
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity);
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.CanAssume);
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.HasRole);
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.CanRead);
    }

    [Fact]
    public void Enumerate_contains_only_snapshot_produces_no_privilege_paths()
    {
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    AzureResourceId = StorageAccountArm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = "/subscriptions/sub/resourceGroups/rg",
                    ToAzureResourceId = StorageAccountArm,
                    RelationshipType = GraphEdgeTypes.Contains,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> candidates =
            PrivilegePathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        candidates.Should().BeEmpty();
    }

    [Fact]
    public async Task RunAsync_foreign_tenant_returns_not_found()
    {
        ScopeContext ownerScope = CreateScope();
        ScopeContext foreignScope = new()
        {
            TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        AzureInventorySnapshotDetailReadModel snapshot = BuildManagedIdentityBlobReaderSnapshot(
            Guid.NewGuid(),
            Guid.NewGuid());

        PrivilegePathEngine sut = CreateEngine(
            snapshot,
            ownerScope,
            new InMemorySecurityEvidencePathRepository(),
            CreateIngestService(new InMemoryOperationalSecurityFindingRepository()));

        PrivilegePathEngineResult result = await sut.RunAsync(
            foreignScope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task RunAsync_second_run_deduplicates_findings_and_paths()
    {
        Guid storageRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        ScopeContext scope = CreateScope();

        AzureInventorySnapshotDetailReadModel snapshot = BuildManagedIdentityBlobReaderSnapshot(
            storageRowId,
            managedIdentityRowId);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            ingestService);

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

        first.Succeeded.Should().BeTrue();
        first.FindingsIngested.Should().BeGreaterThan(0);
        first.PathsPersisted.Should().BeGreaterThan(0);

        second.Succeeded.Should().BeTrue();
        second.PathsPersisted.Should().Be(0);
        second.FindingsDeduplicated.Should().Be(first.PathsDiscovered);
        findingRepository.StoredFindings.Should().HaveCount(first.FindingsIngested);
        pathRepository.StoredPaths.Should().HaveCount(first.PathsPersisted);
    }

    [Fact]
    public void Enumerate_unknown_role_emits_insufficient_evidence_hop()
    {
        const string principalNode = "azure-ad://principal/cccccccc-cccc-cccc-cccc-cccccccccccc";
        const string scopeArm = "/subscriptions/sub/resourceGroups/rg";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    AzureResourceId = scopeArm,
                    ResourceType = "Microsoft.Resources/subscriptions/resourceGroups",
                },
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = "cccccccc-cccc-cccc-cccc-cccccccccccc",
                    Scope = scopeArm,
                    RoleDefinitionId =
                        "/providers/Microsoft.Authorization/roleDefinitions/00000000-0000-0000-0000-000000000099",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = principalNode,
                    ToAzureResourceId = scopeArm,
                    RelationshipType = GraphEdgeTypes.HasRole,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> candidates =
            PrivilegePathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        PrivilegePathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeTrue();
        candidate.Hops[^1].EdgeType.Should().Be("unknown-role-actions");
    }

    [Fact]
    public void PrivilegePathEngine_is_not_a_finding_engine_plugin()
    {
        typeof(PrivilegePathEngine).Should().NotImplement<IFindingEngine>();
        typeof(PrivilegePathEngine).Should().NotImplement<IEffectfulFindingEngine>();
    }

    private static PrivilegePathEngine CreateEngine(
        AzureInventorySnapshotDetailReadModel snapshot,
        ScopeContext scope,
        InMemorySecurityEvidencePathRepository pathRepository,
        OperationalSecurityFindingIngestService ingestService)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return new PrivilegePathEngine(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<PrivilegePathEngine>.Instance);
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

    private static AzureInventorySnapshotDetailReadModel BuildManagedIdentityBlobReaderSnapshot(
        Guid storageRowId,
        Guid managedIdentityRowId)
    {
        string userPrincipalNode = AzureInventoryPrincipalNodeId.Format(UserPrincipalId);
        string managedIdentityPrincipalNode = AzureInventoryPrincipalNodeId.Format(ManagedIdentityPrincipalId);

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = CreateHeader(),
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = storageRowId,
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    AzureResourceId = StorageAccountArm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = Guid.NewGuid(),
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = managedIdentityRowId,
                    SnapshotId = SnapshotId,
                    TenantId = TenantId,
                    AzureResourceId = ManagedIdentityArm,
                    ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                },
            ],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = managedIdentityRowId,
                    PropertyKey = "principalId",
                    PropertyValue = ManagedIdentityPrincipalId,
                },
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = ManagedIdentityPrincipalId,
                    Scope = StorageAccountArm,
                    RoleDefinitionId = BlobReaderRoleDefinitionId,
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = userPrincipalNode,
                    ToAzureResourceId = ManagedIdentityArm,
                    RelationshipType = GraphEdgeTypes.UsesIdentity,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = StorageAccountArm,
                    RelationshipType = GraphEdgeTypes.HasRole,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = StorageAccountArm,
                    RelationshipType = GraphEdgeTypes.CanRead,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
            ],
        };
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
    }

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public List<OperationalSecurityFindingObservationRecord> StoredObservations { get; } = [];

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
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId && finding.FindingId == findingId);

            return Task.FromResult(match);
        }

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

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

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
            StoredObservations.Add(observation);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default)
        {
            int index = StoredFindings.FindIndex(row => row.FindingId == finding.FindingId);

            if (index >= 0)
            {
                StoredFindings[index] = finding;
            }

            StoredMetadata.AddRange(metadata);

            if (observation is not null)
            {
                StoredObservations.Add(observation);
            }

            return Task.CompletedTask;
        }
    }
}
