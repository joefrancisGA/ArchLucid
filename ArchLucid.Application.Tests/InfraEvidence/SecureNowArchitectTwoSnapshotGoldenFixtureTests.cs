using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

/// <summary>
///     End-to-end proof that IE-02 companion JSON deltas produce SA-11 path-removal metrics.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowArchitectTwoSnapshotGoldenFixtureTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly Guid FromSnapshotId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ToSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    private const string StorageAccountArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string ContributorRoleDefinitionId =
        "/subscriptions/sub/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";
    private const string UserPrincipalId = "11111111-1111-1111-1111-111111111111";

    [Fact]
    public async Task Contributor_role_assignment_removal_removes_probable_privilege_paths_between_snapshots()
    {
        ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId };

        AzureInventorySecurityEdgeMaterializeResult beforeEdges = MaterializeRoleAssignments(
            $$"""{"scope":"{{StorageAccountArm}}","principalId":"{{UserPrincipalId}}","roleDefinitionId":"{{ContributorRoleDefinitionId}}","pimEligibilityKind":"standing"}""");

        AzureInventorySecurityEdgeMaterializeResult afterEdges = MaterializeRoleAssignments();

        AzureInventorySnapshotDetailReadModel beforeSnapshot =
            BuildSnapshot(FromSnapshotId, beforeEdges.Relationships, includeContributorAssignment: true);
        AzureInventorySnapshotDetailReadModel afterSnapshot =
            BuildSnapshot(ToSnapshotId, afterEdges.Relationships, includeContributorAssignment: false);

        TwoSnapshotPathRunResult beforeRun = await RunPrivilegePathEngineAsync(
            scope,
            FromSnapshotId,
            beforeSnapshot);
        TwoSnapshotPathRunResult afterRun = await RunPrivilegePathEngineAsync(
            scope,
            ToSnapshotId,
            afterSnapshot);

        beforeRun.PathsPersisted.Should().BeGreaterThan(0);
        afterRun.PathsPersisted.Should().Be(0);
        beforeRun.Paths.Should().OnlyContain(path => path.PathConfidenceBand == PathConfidenceBand.Probable);

        SecureNowArchitectOutcomeMetricsResult metrics = SecureNowArchitectOutcomeMetricsCalculator.Calculate(
            new SecureNowArchitectOutcomeMetricsInputs
            {
                FromSnapshot = beforeSnapshot.Header,
                ToSnapshot = afterSnapshot.Header,
                FromPaths = new SecureNowArchitectOutcomeMetricsSnapshotData
                {
                    Paths = beforeRun.Paths,
                    HopsByPathId = beforeRun.HopsByPathId,
                },
                ToPaths = new SecureNowArchitectOutcomeMetricsSnapshotData
                {
                    Paths = afterRun.Paths,
                    HopsByPathId = afterRun.HopsByPathId,
                },
            });

        metrics.CriticalOrHighConfidencePathsRemoved.Should().Be(0);

        int removedPathHashes = beforeRun.Paths.Count(path =>
            !afterRun.Paths.Any(afterPath =>
                afterPath.CanonicalHopHashSha256.AsSpan()
                    .SequenceEqual(path.CanonicalHopHashSha256)));

        removedPathHashes.Should().BeGreaterThan(0);
    }

    private static AzureInventorySecurityEdgeMaterializeResult MaterializeRoleAssignments(
        params string[] assignmentJsonRows)
    {
        List<System.Text.Json.JsonElement> assignments = assignmentJsonRows
            .Select(ParseJson)
            .ToList();

        return AzureInventorySecurityEdgeMaterializer.Materialize(
            [],
            assignments,
            [],
            [],
            [],
            [],
            federatedCredentialsFilePresent: false,
            [],
            entraGroupMembershipsFilePresent: false,
            [],
            effectiveNetworkControlsFilePresent: false);
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        IReadOnlyList<AzureInventoryResourceRelationshipWrite> relationships,
        bool includeContributorAssignment)
    {
        Guid storageRowId = Guid.NewGuid();

        List<AzureInventoryRoleAssignmentReadModel> roleAssignments = [];

        if (includeContributorAssignment)
        {
            roleAssignments.Add(new AzureInventoryRoleAssignmentReadModel
            {
                PrincipalId = UserPrincipalId,
                Scope = StorageAccountArm,
                RoleDefinitionId = ContributorRoleDefinitionId,
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
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
                CreatedUtc = DateTime.UtcNow.AddDays(-2),
                UpdatedUtc = DateTime.UtcNow.AddDays(-1),
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = storageRowId,
                    SnapshotId = snapshotId,
                    TenantId = TenantId,
                    AzureResourceId = StorageAccountArm,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    CloudResourceId = Guid.NewGuid(),
                },
            ],
            RoleAssignments = roleAssignments,
            Relationships = relationships
                .Select(relationship => new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = relationship.FromAzureResourceId,
                    ToAzureResourceId = relationship.ToAzureResourceId,
                    RelationshipType = relationship.RelationshipType,
                    ProvenanceKind = relationship.ProvenanceKind,
                    InferenceSource = relationship.InferenceSource,
                })
                .ToList(),
        };
    }

    private static async Task<TwoSnapshotPathRunResult> RunPrivilegePathEngineAsync(
        ScopeContext scope,
        Guid snapshotId,
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        GoldenFixturePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        OperationalSecurityFindingIngestService ingestService = CreateIngestService(findingRepository);

        PrivilegePathEngine engine = new(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<PrivilegePathEngine>.Instance);

        PrivilegePathEngineResult result = await engine.RunAsync(
            scope,
            snapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();

        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> hopsByPathId =
            pathRepository.StoredPaths.ToDictionary(
                path => path.PathId,
                path => (IReadOnlyList<SecurityEvidencePathHopRecord>)pathRepository.StoredHops
                    .Where(hop => hop.PathId == path.PathId)
                    .OrderBy(static hop => hop.HopOrdinal)
                    .ToList());

        return new TwoSnapshotPathRunResult
        {
            PathsPersisted = result.PathsPersisted,
            Paths = pathRepository.StoredPaths,
            HopsByPathId = hopsByPathId,
        };
    }

    private static OperationalSecurityFindingIngestService CreateIngestService(
        InMemoryOperationalSecurityFindingRepository repository)
    {
        Mock<ArchLucid.Core.Audit.IAuditService> auditService = new();

        return new OperationalSecurityFindingIngestService(
            repository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);
    }

    private static System.Text.Json.JsonElement ParseJson(string json)
    {
        using System.Text.Json.JsonDocument document = System.Text.Json.JsonDocument.Parse(json);
        return document.RootElement.Clone();
    }

    private sealed class TwoSnapshotPathRunResult
    {
        public int PathsPersisted
        {
            get;
            init;
        }

        public IReadOnlyList<SecurityEvidencePathRecord> Paths
        {
            get;
            init;
        } = [];

        public IReadOnlyDictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> HopsByPathId
        {
            get;
            init;
        } = new Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>>();
    }

    private sealed class GoldenFixturePathRepository : ISecurityEvidencePathRepository
    {
        public List<SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public List<SecurityEvidencePathHopRecord> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(StoredPaths.FirstOrDefault(path =>
                path.TenantId == tenantId && path.PathId == pathId));

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(StoredPaths.FirstOrDefault(path =>
                path.TenantId == tenantId
                && path.SnapshotId == snapshotId
                && path.CanonicalHopHashSha256.SequenceEqual(canonicalHopHashSha256)));

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

            foreach (SecurityEvidencePathHopRecord hop in validated.Hops)
            {
                StoredHops.Add(hop);
            }

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

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(StoredFindings);

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
