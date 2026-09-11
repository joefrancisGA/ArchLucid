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
public sealed class ToxicCombinationEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1");
    private static readonly Guid WorkspaceId = Guid.Parse("c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2");
    private static readonly Guid ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
    private static readonly Guid SnapshotId = Guid.Parse("c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4");
    private static readonly Guid StorageCloudResourceId = Guid.Parse("d5d5d5d5-d5d5-d5d5-d5d5-d5d5d5d5d5d5");

    private const string SubscriptionId = "11111111-1111-1111-1111-111111111111";
    private const string PublicIpArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1";
    private const string NicArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
    private const string SubnetArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
    private const string StorageArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ManagedIdentityArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/worker";
    private const string UserPrincipalId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    private const string ManagedIdentityPrincipalId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    private const string BlobReaderRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/2a2b9908-6ea1-4ae2-8e65-a410df84e7dd";

    [Fact]
    public async Task RunAsync_public_storage_mi_reader_and_egress_compose_toxic_path()
    {
        ScopeContext scope = CreateScope();
        Guid storageRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot =
            BuildToxicCombinationSnapshot(storageRowId, managedIdentityRowId);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine privilegeEngine = CreatePrivilegeEngine(snapshot, scope, pathRepository, ingestService);
        IntendedReachabilityEngine reachabilityEngine =
            CreateReachabilityEngine(snapshot, scope, pathRepository, ingestService);
        ToxicCombinationEngine toxicEngine = CreateToxicEngine(snapshot, scope, pathRepository, ingestService);

        (await privilegeEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None))
            .PathsDiscovered.Should().BeGreaterThan(0);
        (await reachabilityEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None))
            .PathsDiscovered.Should().BeGreaterThan(0);

        PrivilegePathEngineResult result = await toxicEngine.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().BeGreaterThan(0);
        result.FindingsIngested.Should().BeGreaterThan(0);

        SecurityEvidencePathRecord toxicPath = pathRepository.StoredPaths
            .Should()
            .ContainSingle(path => path.PathKind == PathKind.ToxicCombination)
            .Subject;

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(TenantId, toxicPath.PathId, CancellationToken.None);

        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.Exposes);
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity);
        hops.Should().Contain(hop => hop.EdgeType == GraphEdgeTypes.CanRead);
        hops.Should().Contain(hop =>
            hop.EdgeType == SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType);

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings
            .Should()
            .ContainSingle(storedFinding =>
                storedFinding.PathId == toxicPath.PathId
                && storedFinding.ControlId == SecureNowArchitectConstants.ToxicCombinationControlId)
            .Subject;

        finding.Title.Should().StartWith("Toxic combination:");
        finding.Title.Should().Contain("sa1");
        finding.Description.Should().NotContain("multiple issues detected");
        finding.Description.Should().Contain("Composed exposure, identity, and asset path");
    }

    [Fact]
    public async Task RunAsync_adds_defender_secure_score_band_metadata_when_companion_present()
    {
        ScopeContext scope = CreateScope();
        Guid storageRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel baseSnapshot =
            BuildToxicCombinationSnapshot(storageRowId, managedIdentityRowId);

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = baseSnapshot.Header,
            Resources = baseSnapshot.Resources,
            Properties = baseSnapshot.Properties,
            RoleAssignments = baseSnapshot.RoleAssignments,
            Relationships = baseSnapshot.Relationships,
            DefenderSummaries =
            [
                new AzureInventoryDefenderSummaryReadModel
                {
                    ResourceId = $"/subscriptions/{SubscriptionId}",
                    SecureScore = 35,
                },
            ],
        };

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine privilegeEngine = CreatePrivilegeEngine(snapshot, scope, pathRepository, ingestService);
        IntendedReachabilityEngine reachabilityEngine =
            CreateReachabilityEngine(snapshot, scope, pathRepository, ingestService);
        ToxicCombinationEngine toxicEngine = CreateToxicEngine(snapshot, scope, pathRepository, ingestService);

        await privilegeEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None);
        await reachabilityEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None);

        await toxicEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None);

        findingRepository.StoredMetadata.Should().ContainSingle(metadata =>
            metadata.MetadataKey == SecureNowArchitectConstants.DefenderSecureScoreBandMetadataKey
            && metadata.MetadataValue == "Low");
    }

    [Fact]
    public async Task RunAsync_only_privilege_paths_produces_no_toxic_combination()
    {
        ScopeContext scope = CreateScope();
        Guid storageRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot =
            BuildManagedIdentityBlobReaderSnapshot(storageRowId, managedIdentityRowId);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine privilegeEngine = CreatePrivilegeEngine(snapshot, scope, pathRepository, ingestService);
        ToxicCombinationEngine toxicEngine = CreateToxicEngine(snapshot, scope, pathRepository, ingestService);

        (await privilegeEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None))
            .PathsDiscovered.Should().BeGreaterThan(0);

        PrivilegePathEngineResult result = await toxicEngine.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().Be(0);
        pathRepository.StoredPaths.Should().NotContain(path => path.PathKind == PathKind.ToxicCombination);
    }

    [Fact]
    public async Task RunAsync_missing_tag_finding_without_paths_does_not_compose()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: true);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);
        ToxicCombinationEngine toxicEngine = CreateToxicEngine(snapshot, scope, pathRepository, ingestService);

        await ingestService.IngestBatchAsync(
            scope,
            [
                new OperationalSecurityFindingIngestItem
                {
                    Provider = CloudProvider.Azure,
                    SourceSystem = "AzurePolicy",
                    SourceFindingId = "missing-tag-env",
                    CloudResourceId = StorageCloudResourceId,
                    ExternalResourceId = StorageArm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    SubscriptionOrAccountId = SubscriptionId,
                    ControlId = "policy.missing-tag",
                    Title = "Missing environment tag",
                    Description = "Resource is missing required Environment tag.",
                    Severity = "Low",
                    Status = OperationalSecurityFindingStatus.Open,
                    RawEvidenceReference = "policy-scan",
                },
            ],
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        PrivilegePathEngineResult result = await toxicEngine.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().Be(0);
        findingRepository.StoredFindings.Should().ContainSingle(finding => finding.SourceSystem == "AzurePolicy");
    }

    [Fact]
    public async Task RunAsync_second_run_deduplicates_findings()
    {
        ScopeContext scope = CreateScope();
        Guid storageRowId = Guid.NewGuid();
        Guid managedIdentityRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot =
            BuildToxicCombinationSnapshot(storageRowId, managedIdentityRowId);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine privilegeEngine = CreatePrivilegeEngine(snapshot, scope, pathRepository, ingestService);
        IntendedReachabilityEngine reachabilityEngine =
            CreateReachabilityEngine(snapshot, scope, pathRepository, ingestService);
        ToxicCombinationEngine toxicEngine = CreateToxicEngine(snapshot, scope, pathRepository, ingestService);

        await privilegeEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None);
        await reachabilityEngine.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None);

        PrivilegePathEngineResult first = await toxicEngine.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        PrivilegePathEngineResult second = await toxicEngine.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        first.FindingsIngested.Should().BeGreaterThan(0);
        second.FindingsDeduplicated.Should().Be(first.PathsDiscovered);
        findingRepository.StoredFindings
            .Count(finding => finding.ControlId == SecureNowArchitectConstants.ToxicCombinationControlId)
            .Should()
            .Be(first.FindingsIngested);
    }

    [Fact]
    public void ToxicCombinationEngine_is_not_a_finding_engine_plugin()
    {
        typeof(ToxicCombinationEngine).Should().NotImplement<IFindingEngine>();
        typeof(ToxicCombinationEngine).Should().NotImplement<IEffectfulFindingEngine>();
    }

    private static AzureInventorySnapshotDetailReadModel BuildToxicCombinationSnapshot(
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
                Resource(PublicIpArm, "Microsoft.Network/publicIPAddresses", Guid.NewGuid()),
                Resource(NicArm, "Microsoft.Network/networkInterfaces", Guid.NewGuid()),
                Resource(SubnetArm, "Microsoft.Network/virtualNetworks/subnets", Guid.NewGuid()),
                Resource(StorageArm, "Microsoft.Storage/storageAccounts", storageRowId, StorageCloudResourceId),
                Resource(ManagedIdentityArm, "Microsoft.ManagedIdentity/userAssignedIdentities", managedIdentityRowId),
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
                    Scope = StorageArm,
                    RoleDefinitionId = BlobReaderRoleDefinitionId,
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = PublicIpArm,
                    ToAzureResourceId = NicArm,
                    RelationshipType = GraphEdgeTypes.Exposes,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = NicArm,
                    ToAzureResourceId = SubnetArm,
                    RelationshipType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = SubnetArm,
                    ToAzureResourceId = StorageArm,
                    RelationshipType = GraphEdgeTypes.RoutesTo,
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = SubnetArm,
                    ToAzureResourceId = SecureNowArchitectConstants.InternetEgressNodeId,
                    RelationshipType = SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType,
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                },
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
                    ToAzureResourceId = StorageArm,
                    RelationshipType = GraphEdgeTypes.HasRole,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = StorageArm,
                    RelationshipType = GraphEdgeTypes.CanRead,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
            ],
        };
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
                Resource(StorageArm, "Microsoft.Storage/storageAccounts", storageRowId, StorageCloudResourceId),
                Resource(ManagedIdentityArm, "Microsoft.ManagedIdentity/userAssignedIdentities", managedIdentityRowId),
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
                    Scope = StorageArm,
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
                    ToAzureResourceId = StorageArm,
                    RelationshipType = GraphEdgeTypes.HasRole,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = managedIdentityPrincipalNode,
                    ToAzureResourceId = StorageArm,
                    RelationshipType = GraphEdgeTypes.CanRead,
                    ProvenanceKind = ProvenanceKind.DerivedFact,
                },
            ],
        };
    }

    private static AzureInventorySnapshotDetailReadModel BuildPublicStoragePathSnapshot(bool includeNsgRoute) =>
        new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(PublicIpArm, "Microsoft.Network/publicIPAddresses", Guid.NewGuid()),
                Resource(NicArm, "Microsoft.Network/networkInterfaces", Guid.NewGuid()),
                Resource(SubnetArm, "Microsoft.Network/virtualNetworks/subnets", Guid.NewGuid()),
                Resource(StorageArm, "Microsoft.Storage/storageAccounts", Guid.NewGuid(), StorageCloudResourceId),
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = PublicIpArm,
                    ToAzureResourceId = NicArm,
                    RelationshipType = GraphEdgeTypes.Exposes,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = NicArm,
                    ToAzureResourceId = SubnetArm,
                    RelationshipType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = SubnetArm,
                    ToAzureResourceId = StorageArm,
                    RelationshipType = includeNsgRoute
                        ? GraphEdgeTypes.RoutesTo
                        : GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = includeNsgRoute
                        ? ProvenanceKind.DeterministicInference
                        : ProvenanceKind.ObservedFact,
                },
            ],
        };

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

    private static PrivilegePathEngine CreatePrivilegeEngine(
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

    private static IntendedReachabilityEngine CreateReachabilityEngine(
        AzureInventorySnapshotDetailReadModel snapshot,
        ScopeContext scope,
        InMemorySecurityEvidencePathRepository pathRepository,
        OperationalSecurityFindingIngestService ingestService)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return new IntendedReachabilityEngine(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<IntendedReachabilityEngine>.Instance);
    }

    private static ToxicCombinationEngine CreateToxicEngine(
        AzureInventorySnapshotDetailReadModel snapshot,
        ScopeContext scope,
        InMemorySecurityEvidencePathRepository pathRepository,
        OperationalSecurityFindingIngestService ingestService)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        return new ToxicCombinationEngine(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<ToxicCombinationEngine>.Instance);
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
            CancellationToken cancellationToken = default)
        {
            IEnumerable<SecurityEvidencePathRecord> query = StoredPaths.Where(path =>
                path.TenantId == tenantId
                && path.WorkspaceId == workspaceId
                && path.ProjectId == projectId);

            if (filter.SnapshotId.HasValue)
            {
                query = query.Where(path => path.SnapshotId == filter.SnapshotId.Value);
            }

            if (filter.PathKind.HasValue)
            {
                query = query.Where(path => path.PathKind == filter.PathKind.Value);
            }

            List<SecurityEvidencePathRecord> items = query
                .OrderByDescending(static path => path.CreatedUtc)
                .ThenBy(static path => path.PathId)
                .Skip(Math.Max(0, page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            int totalCount = query.Count();

            return Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>((items, totalCount));
        }

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            Guid snapshotId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidencePathRecord>>(
                StoredPaths
                    .Where(path =>
                        path.TenantId == tenantId
                        && path.WorkspaceId == workspaceId
                        && path.ProjectId == projectId
                        && path.SnapshotId == snapshotId)
                    .ToList());
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
