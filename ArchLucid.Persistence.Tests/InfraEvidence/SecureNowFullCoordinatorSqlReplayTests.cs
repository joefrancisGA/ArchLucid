using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

/// <summary>
/// Offline ZIP -> actual SQL snapshot materializer -> actual SecureNow full coordinator.
/// Tests a positive privilege path and downstream persisted ranks and cut-point reads.
/// This does not authorize using the test fixture against customer or production SQL.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SecureNowFullCoordinatorSqlReplayTests(SqlServerPersistenceFixture fixture)
{
    private const string RoleId =
        "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";
    private const string PrincipalId = "11111111-2222-3333-4444-555555555555";

    [SkippableFact]
    public async Task Materialized_offline_zip_runs_full_coordinator_and_persists_path_rank_and_finding()
    {
        Skip.IfNot(
            fixture.IsSqlServerAvailable,
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        SqlConnectionStringBuilder connection = new(fixture.ConnectionString);
        connection.InitialCatalog.Should().Contain(
            "Test", "the SQL fixture must target a disposable test catalog");

        string subscriptionId = Guid.NewGuid().ToString("D");
        string storageArmId = $"/subscriptions/{subscriptionId}/resourceGroups/rg-lab/" +
                              "providers/Microsoft.Storage/storageAccounts/securelab";
        byte[] zip = BuildZip(subscriptionId, storageArmId);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid packageId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        DateTime now = DateTime.UtcNow;

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlAzureExtractorPackageRepository packages = new(factory);
        SqlAzureInventorySnapshotRepository snapshots = new(factory);
        SqlCloudResourceIdentityDirectory identities = new(factory);
        SqlSecurityEvidencePathRepository paths = new(factory);
        SqlOperationalSecurityFindingRepository operationalFindings = new(factory);
        SqlSecurityEvidencePathSearchCoverageRepository searchCoverage = new(factory);
        SqlSecurityEvidencePathRankRepository rankRepository = new(factory);
        SqlSecurityEvidenceCutPointRepository cutPointRepository = new(factory);
        SqlSecurityEvidencePathRoutingRepository routingRepository = new(factory);
        SqlRemediationPatternRepository remediationPatterns = new(factory);
        SqlAzureInventoryDiffRepository diffs = new(factory);

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        OperationalSecurityFindingIngestService findingIngest = new(
            operationalFindings,
            audit.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        // All eight production security engines use real, SQL-backed path/finding
        // repositories. Empty approval/assertion inputs are legitimate for a new
        // synthetic tenant; never manufacture an owner's intent or an approval.
        PrivilegePathEngine privilege = new(
            snapshots, paths, findingIngest, NullLogger<PrivilegePathEngine>.Instance, searchCoverage);
        IntendedReachabilityEngine reachability = new(
            snapshots, paths, findingIngest, NullLogger<IntendedReachabilityEngine>.Instance, searchCoverage);
        ToxicCombinationEngine toxic = new(
            snapshots, paths, findingIngest, NullLogger<ToxicCombinationEngine>.Instance, searchCoverage);
        CapabilityToFlowEngine capability = new(
            snapshots, paths, findingIngest, NullLogger<CapabilityToFlowEngine>.Instance);
        SharedControlBlastRadiusEngine shared = new(
            snapshots, paths, findingIngest, NullLogger<SharedControlBlastRadiusEngine>.Instance);

        Mock<IArchitectureDiagramReconciliationRepository> diagramRecon = new(MockBehavior.Strict);
        diagramRecon.Setup(r => r.ListBySnapshotAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        FourRealityDriftEngine fourReality = new(
            snapshots, diffs, diagramRecon.Object, paths, findingIngest,
            NullLogger<FourRealityDriftEngine>.Instance);

        Mock<ISecurityAssetAssertionResolver> assertions = new(MockBehavior.Strict);
        assertions.Setup(r => r.GetActiveCrownJewelAssertionIdsAsync(
                It.IsAny<ProjectScopeKey>(), It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<Guid>());
        PathRankingEngine ranking = new(
            paths, rankRepository, assertions.Object, snapshots,
            NullLogger<PathRankingEngine>.Instance);
        CutPointAnalysisEngine cutPoints = new(
            paths, rankRepository, cutPointRepository, snapshots, remediationPatterns,
            NullLogger<CutPointAnalysisEngine>.Instance);
        SecurityEvidencePathRoutingSyncService routing = new(
            snapshots, paths, routingRepository);

        // With one newly created snapshot in a unique synthetic subscription,
        // there is no incremental prior snapshot. Any unexpected call is an error.
        Mock<IAzureInventoryDiffService> diffService = new(MockBehavior.Strict);
        Mock<ISecureNowArchitectNeighborhoodRunner> neighborhood = new(MockBehavior.Strict);
        AzureInventorySnapshotPostMaterializeCoordinator coordinator = new(
            snapshots,
            diffService.Object,
            Options.Create(new SecureNowArchitectNeighborhoodOptions { FullRecompute = true }),
            neighborhood.Object,
            privilege,
            reachability,
            toxic,
            capability,
            shared,
            fourReality,
            ranking,
            cutPoints,
            routing);

        await packages.InsertAsync(new AzureExtractorPackageRecord
        {
            PackageId = packageId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CreatedUtc = now,
            SchemaVersion = 2,
            ScriptVersion = "securenow-full-coordinator-replay-test",
            CollectionTimestampUtc = now,
            SubscriptionId = subscriptionId,
            OriginalFileName = "synthetic-offline-full-replay.zip",
            ManifestJson = "{}",
            PackageBytes = zip,
        }, CancellationToken.None);

        await snapshots.InsertHeaderAsync(new AzureInventorySnapshotRecord
        {
            SnapshotId = snapshotId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            PackageId = packageId,
            SubscriptionId = subscriptionId,
            CaptureStatus = AzureInventoryCaptureStatus.Pending,
            CreatedUtc = now,
            UpdatedUtc = now,
        });

        // Unlike the preceding increments, the materializer is wired to the real
        // post-materialize coordinator: no no-op coordinator is used.
        AzureInventorySnapshotMaterializer materializer = new(
            snapshots,
            identities,
            coordinator,
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);
        AzureInventorySnapshotMaterializeResult materialized =
            await materializer.TryMaterializePackageAsync(
                scope,
                snapshotId,
                packageId,
                zip,
                AzureInventoryCaptureMethod.CustomerScript,
                "securenow-full-coordinator-replay-test");

        materialized.Succeeded.Should().BeTrue(materialized.ErrorMessage);
        materialized.ResourceCount.Should().Be(1);

        ProjectScopeKey ownProject =
            ProjectScopeKey.Create(scope.TenantId, scope.WorkspaceId, scope.ProjectId);
        ProjectSnapshotScopeKey ownSnapshot =
            ProjectSnapshotScopeKey.Create(ownProject, snapshotId);

        IReadOnlyList<SecurityEvidencePathWithHops> observedPaths =
            await paths.ListWithHopsBySnapshotAsync(ownSnapshot);
        observedPaths.Should().NotBeEmpty(
            "a Contributor role on a captured storage account must yield a real privilege path");
        observedPaths.Should().Contain(p => p.Path.PathKind == PathKind.Privilege);
        observedPaths.Should().OnlyContain(p => p.Hops.Count > 0);

        IReadOnlyList<SecurityEvidencePathRankRecord> ranks =
            await rankRepository.ListBySnapshotAsync(ownSnapshot);
        ranks.Should().HaveCount(observedPaths.Count,
            "the real ranking stage must cover every persisted path");

        // The coordinator currently returns Task (not a stage-result aggregate).
        // Separately verify the real production engines report success: otherwise
        // a swallowed Succeeded=false could be mistaken for a passing replay.
        string actor = SecureNowArchitectConstants.SystemActorId;
        (await privilege.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await reachability.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await toxic.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await capability.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await shared.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await fourReality.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await ranking.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        (await cutPoints.RunAsync(scope, snapshotId, actor)).Succeeded.Should().BeTrue();
        await routing.SyncSnapshotAsync(scope, snapshotId);

        // A zero-cutpoint result can be valid for some graph shapes; the SQL
        // cut-point query is still exercised. Do not claim a positive count.
        IReadOnlyList<SecurityEvidenceCutPointRecord> cuts =
            await cutPointRepository.ListBySnapshotAsync(ownSnapshot);
        cuts.Should().NotBeNull();

        foreach (SecurityEvidencePathWithHops path in observedPaths)
        {
            path.Path.TenantId.Should().Be(scope.TenantId);
            path.Path.WorkspaceId.Should().Be(scope.WorkspaceId);
            path.Path.ProjectId.Should().Be(scope.ProjectId);
            path.Path.SnapshotId.Should().Be(snapshotId);
            path.Hops.Should().OnlyContain(h => !string.IsNullOrWhiteSpace(h.EvidenceReference));

            if (path.Path.PathKind == PathKind.Privilege)
            {
                IReadOnlyList<Guid> findings =
                    await operationalFindings.ListFindingIdsByPathIdInScopeAsync(
                        ownProject, path.Path.PathId);
                findings.Should().NotBeEmpty(
                    "the real operational finding ingest must cite its privilege path");
            }
        }

        ProjectScopeKey[] foreignScopes =
        [
            ProjectScopeKey.Create(Guid.NewGuid(), scope.WorkspaceId, scope.ProjectId),
            ProjectScopeKey.Create(scope.TenantId, Guid.NewGuid(), scope.ProjectId),
            ProjectScopeKey.Create(scope.TenantId, scope.WorkspaceId, Guid.NewGuid()),
        ];
        foreach (ProjectScopeKey foreign in foreignScopes)
        {
            ProjectSnapshotScopeKey foreignSnapshot =
                ProjectSnapshotScopeKey.Create(foreign, snapshotId);
            (await paths.ListBySnapshotAsync(foreignSnapshot)).Should().BeEmpty();
            (await rankRepository.ListBySnapshotAsync(foreignSnapshot)).Should().BeEmpty();
            (await cutPointRepository.ListBySnapshotAsync(foreignSnapshot)).Should().BeEmpty();
            foreach (SecurityEvidencePathWithHops path in observedPaths)
            {
                (await operationalFindings.ListFindingIdsByPathIdInScopeAsync(
                    foreign, path.Path.PathId)).Should().BeEmpty();
            }
        }

        // Do not confuse one completed pass with exactly-once semantics.
        // The production path/finding identity must survive a second evaluation.
        await coordinator.OnSnapshotMaterializedAsync(scope, snapshotId, subscriptionId);

        IReadOnlyList<SecurityEvidencePathWithHops> secondPass =
            await paths.ListWithHopsBySnapshotAsync(ownSnapshot);
        secondPass.Select(p => Convert.ToHexString(p.Path.CanonicalHopHashSha256))
            .Order()
            .Should().Equal(observedPaths
                .Select(p => Convert.ToHexString(p.Path.CanonicalHopHashSha256))
                .Order());
        (await rankRepository.ListBySnapshotAsync(ownSnapshot)).Should()
            .HaveCount(secondPass.Count);
    }

    private static byte[] BuildZip(string subscriptionId, string storageArmId)
    {
        using MemoryStream buffer = new();
        using (ZipArchive zip = new(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            Write(zip, "manifest.json",
                $$"""
                  {"schemaVersion":2,
                   "scriptVersion":"securenow-full-coordinator-replay-test",
                   "collectionTimestamp":"2026-11-01T00:00:00Z",
                   "subscriptionId":"{{subscriptionId}}",
                   "scope":"/subscriptions/{{subscriptionId}}",
                   "switchesUsed":[],"azModuleVersion":"test"}
                  """);
            Write(zip, "resources.json",
                $$"""
                  [{
                    "resourceId":"{{storageArmId}}",
                    "resourceType":"Microsoft.Storage/storageAccounts",
                    "name":"securelab",
                    "resourceGroup":"rg-lab",
                    "location":"eastus",
                    "properties":{"publicNetworkAccess":"Enabled"},
                    "tags":{"environment":"production"}
                  }]
                  """);
            Write(zip, "role-assignments.json",
                $$"""
                  [{
                    "principalId":"{{PrincipalId}}",
                    "scope":"{{storageArmId}}",
                    "roleDefinitionId":"{{RoleId}}"
                  }]
                  """);
        }
        return buffer.ToArray();
    }

    private static void Write(ZipArchive zip, string name, string content)
    {
        using StreamWriter writer = new(
            zip.CreateEntry(name).Open(), new UTF8Encoding(false));
        writer.Write(content);
    }
}
