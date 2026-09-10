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
public sealed class CapabilityToFlowEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectId = Guid.Parse("b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3");
    private static readonly Guid SnapshotId = Guid.Parse("b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4");
    private static readonly Guid SqlCloudResourceId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5");

    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";
    private const string SqlArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
    private const string AksArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks1";
    private const string ManagedIdentityArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/aks-mi";
    private const string SubnetArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/aks";
    private const string UserPrincipalId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private const string ManagedIdentityPrincipalId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string ReaderRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/acdd72a7-3385-48ef-bd42-f60684581c14";

    [Fact]
    public async Task RunAsync_sql_aks_mi_reader_and_outbound_egress_produces_possible_capability_path()
    {
        ScopeContext scope = CreateScope();
        Guid sqlRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot =
            BuildSqlAksManagedIdentityReaderSnapshot(sqlRowId, managedIdentityRowId);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        CapabilityToFlowEngine sut = CreateEngine(
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
            .ContainSingle(storedPath => storedPath.PathKind == PathKind.CapabilityToFlow)
            .Subject;

        path.PathConfidenceBand.Should().Be(PathConfidenceBand.Possible);

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(TenantId, path.PathId, CancellationToken.None);

        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity);
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.CanRead);
        hops.Should().Contain(hop =>
            hop.EdgeType == SecureNowArchitectConstants.PossibleMovementHopEdgeType);
        hops.Should().Contain(hop =>
            hop.EdgeType == SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType);

        SecurityEvidencePathHopRecord flowHop = hops
            .Should()
            .ContainSingle(hop => hop.EdgeType == SecureNowArchitectConstants.PossibleMovementHopEdgeType)
            .Subject;

        flowHop.ProvenanceKind.Should().NotBe(ProvenanceKind.ObservedFact);
        flowHop.HopConfidenceBand.Should().Be(PathConfidenceBand.Possible);

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings
            .Should()
            .ContainSingle(storedFinding => storedFinding.PathId == path.PathId)
            .Subject;

        finding.BusinessCriticality.Should().Be("Unknown");
        CapabilityToFlowCopyGuard.IsHonestCopy(finding.Title).Should().BeTrue();
        CapabilityToFlowCopyGuard.IsHonestCopy(finding.Description).Should().BeTrue();
        finding.Title.Should().StartWith("Capability-to-flow:");
        finding.Title.Should().Contain("may access");
        finding.Description.Should().Contain("Possible movement");
        finding.Description.Should().NotContain("PHI");
    }

    [Fact]
    public void Enumerate_without_workload_identity_produces_no_capability_paths()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSqlReaderWithoutIdentitySnapshot();
        IReadOnlyList<CapabilityToFlowCandidate> candidates =
            CapabilityToFlowEnumerator.Enumerate(snapshot, new PrivilegePathEngineOptions());

        candidates.Should().BeEmpty();
    }

    [Fact]
    public async Task RunAsync_second_run_deduplicates_findings()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot =
            BuildSqlAksManagedIdentityReaderSnapshot(Guid.NewGuid(), Guid.NewGuid());

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        CapabilityToFlowEngine sut = CreateEngine(
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
    public void CapabilityToFlowCopyGuard_rejects_exfiltration_language()
    {
        CapabilityToFlowCopyGuard.IsHonestCopy("This path exfiltrates customer data.").Should().BeFalse();
        CapabilityToFlowCopyGuard.IsHonestCopy("Workload may access data-bearing SQL asset.").Should().BeTrue();
    }

    [Fact]
    public void CapabilityToFlowEngine_is_not_a_finding_engine_plugin()
    {
        typeof(CapabilityToFlowEngine).Should().NotImplement<IFindingEngine>();
        typeof(CapabilityToFlowEngine).Should().NotImplement<IEffectfulFindingEngine>();
    }

    private static AzureInventorySnapshotDetailReadModel BuildSqlAksManagedIdentityReaderSnapshot(
        Guid sqlRowId,
        Guid managedIdentityRowId)
    {
        string userPrincipalNode = AzureInventoryPrincipalNodeId.Format(UserPrincipalId);
        string managedIdentityPrincipalNode = AzureInventoryPrincipalNodeId.Format(ManagedIdentityPrincipalId);

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(SqlArm, "Microsoft.Sql/servers", sqlRowId, SqlCloudResourceId),
                Resource(AksArm, "Microsoft.ContainerService/managedClusters", Guid.NewGuid()),
                Resource(ManagedIdentityArm, "Microsoft.ManagedIdentity/userAssignedIdentities", managedIdentityRowId),
                Resource(SubnetArm, "Microsoft.Network/virtualNetworks/subnets", Guid.NewGuid()),
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
                    Scope = SqlArm,
                    RoleDefinitionId = ReaderRoleDefinitionId,
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
                    ToAzureResourceId = SqlArm,
                    RelationshipType = GraphEdgeTypes.HasRole,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = SqlArm,
                    RelationshipType = GraphEdgeTypes.CanRead,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = ManagedIdentityArm,
                    ToAzureResourceId = SubnetArm,
                    RelationshipType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = SubnetArm,
                    ToAzureResourceId = SecureNowArchitectConstants.InternetEgressNodeId,
                    RelationshipType = SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType,
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                },
            ],
        };
    }

    private static AzureInventorySnapshotDetailReadModel BuildSqlReaderWithoutIdentitySnapshot()
    {
        string managedIdentityPrincipalNode = AzureInventoryPrincipalNodeId.Format(ManagedIdentityPrincipalId);

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(SqlArm, "Microsoft.Sql/servers", Guid.NewGuid(), SqlCloudResourceId),
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    PrincipalId = ManagedIdentityPrincipalId,
                    Scope = SqlArm,
                    RoleDefinitionId = ReaderRoleDefinitionId,
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = SqlArm,
                    RelationshipType = GraphEdgeTypes.HasRole,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = SqlArm,
                    RelationshipType = GraphEdgeTypes.CanRead,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
            ],
        };
    }

    private static AzureInventoryResourceRecord Resource(
        string armId,
        string resourceType,
        Guid rowId,
        Guid? cloudResourceId = null) =>
        new()
        {
            ResourceRowId = rowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = armId,
            ResourceType = resourceType,
            CloudResourceId = cloudResourceId ?? Guid.NewGuid(),
        };

    private static CapabilityToFlowEngine CreateEngine(
        AzureInventorySnapshotDetailReadModel snapshot,
        ScopeContext scope,
        InMemorySecurityEvidencePathRepository pathRepository,
        OperationalSecurityFindingIngestService ingestService)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return new CapabilityToFlowEngine(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<CapabilityToFlowEngine>.Instance);
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
