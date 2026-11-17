using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

/// <summary>
/// Real positive privilege engine replay of a synthetic ZIP using isolated SQL test
/// repositories for snapshots, paths and operational findings. No Azure/HTTP/LLM calls.
/// A full multi-engine coordinator run is NOT claimed by this single-slice test.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SecureNowSqlPrivilegeEngineReplayTests(SqlServerPersistenceFixture fixture)
{
    private const string ContributorRoleDefinitionId =
        "/providers/Microsoft.Authorization/roleDefinitions/b24988ac-6180-42a0-ab88-20f7382dd24c";
    private const string PrincipalId = "11111111-2222-3333-4444-555555555555";

    [SkippableFact]
    public async Task Offline_zip_to_sql_privilege_path_and_finding_is_idempotent_and_scope_isolated()
    {
        Skip.IfNot(
            fixture.IsSqlServerAvailable,
            SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        // This test intentionally uses the existing DbUp-migrated SQL integration
        // test catalog. Never allow the test to target a production catalog.
        Microsoft.Data.SqlClient.SqlConnectionStringBuilder connection = new(fixture.ConnectionString);
        connection.InitialCatalog.Should().Contain(
            "Test", "offline replay writes must remain in an isolated test catalog");

        string subscriptionId = Guid.NewGuid().ToString("D");
        string storageArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg-lab/providers/" +
            "Microsoft.Storage/storageAccounts/securelab";
        byte[] zip = CreateSyntheticZip(subscriptionId, storageArmId);
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
        SqlAzureExtractorPackageRepository packageRepository = new(factory);
        SqlAzureInventorySnapshotRepository snapshotRepository = new(factory);
        SqlCloudResourceIdentityDirectory identityDirectory = new(factory);
        SqlSecurityEvidencePathRepository pathRepository = new(factory);
        SqlOperationalSecurityFindingRepository findingRepository = new(factory);
        SqlSecurityEvidencePathSearchCoverageRepository searchCoverage = new(factory);

        await packageRepository.InsertAsync(
            new AzureExtractorPackageRecord
            {
                PackageId = packageId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CreatedUtc = now,
                SchemaVersion = 2,
                ScriptVersion = "secure-now-sql-privilege-replay-test",
                CollectionTimestampUtc = now,
                SubscriptionId = subscriptionId,
                OriginalFileName = "synthetic-offline-privilege.zip",
                ManifestJson = "{}",
                PackageBytes = zip,
            },
            CancellationToken.None);

        await snapshotRepository.InsertHeaderAsync(
            new AzureInventorySnapshotRecord
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

        // Deliberately separate materialization from orchestration here so we can
        // prove the real privilege engine, its result and the persisted SQL rows.
        // The full post-materialize coordinator remains a later integration gate.
        Mock<IAzureInventorySnapshotPostMaterializeCoordinator> postMaterialize = new();
        postMaterialize
            .Setup(x => x.OnSnapshotMaterializedAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AzureInventorySnapshotMaterializer materializer = new(
            snapshotRepository,
            identityDirectory,
            postMaterialize.Object,
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult materialized =
            await materializer.TryMaterializePackageAsync(
                scope,
                snapshotId,
                packageId,
                zip,
                AzureInventoryCaptureMethod.CustomerScript,
                "secure-now-sql-privilege-replay-test");

        materialized.Succeeded.Should().BeTrue(materialized.ErrorMessage);
        materialized.ResourceCount.Should().Be(1);
        postMaterialize.Verify(x => x.OnSnapshotMaterializedAsync(
            It.Is<ScopeContext>(s =>
                s.TenantId == scope.TenantId
                && s.WorkspaceId == scope.WorkspaceId
                && s.ProjectId == scope.ProjectId),
            snapshotId,
            subscriptionId,
            It.IsAny<CancellationToken>()), Times.Once);

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetCanonicalSnapshotDetailAsync(scope, snapshotId);
        snapshot.Should().NotBeNull();
        snapshot!.RoleAssignments.Should().ContainSingle(
            role => role.PrincipalId == PrincipalId
                && role.RoleDefinitionId == ContributorRoleDefinitionId);

        Mock<IAuditService> audit = new();
        audit.Setup(x => x.LogAsync(
            It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        OperationalSecurityFindingIngestService findings = new(
            findingRepository,
            audit.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        PrivilegePathEngine engine = new(
            snapshotRepository,
            pathRepository,
            findings,
            NullLogger<PrivilegePathEngine>.Instance,
            searchCoverage);

        PrivilegePathEngineResult first = await engine.RunAsync(
            scope, snapshotId, SecureNowArchitectConstants.SystemActorId);

        first.Succeeded.Should().BeTrue(first.ErrorMessage);
        first.PathsDiscovered.Should().BeGreaterThan(0,
            "a Contributor assignment to an inventoried storage account should produce a privilege path");
        first.PathsPersisted.Should().BeGreaterThan(0,
            "a successful run must actually create SQL path rows");
        first.FindingsIngested.Should().BeGreaterThan(0,
            "path-linked operational findings must also be persisted");

        ProjectScopeKey own = ProjectScopeKey.Create(
            scope.TenantId, scope.WorkspaceId, scope.ProjectId);
        ProjectSnapshotScopeKey ownSnapshot = ProjectSnapshotScopeKey.Create(own, snapshotId);
        IReadOnlyList<SecurityEvidencePathRecord> paths =
            await pathRepository.ListBySnapshotAsync(ownSnapshot);
        paths.Should().NotBeEmpty();

        foreach (SecurityEvidencePathRecord path in paths)
        {
            path.SnapshotId.Should().Be(snapshotId);
            path.TenantId.Should().Be(scope.TenantId);
            path.WorkspaceId.Should().Be(scope.WorkspaceId);
            path.ProjectId.Should().Be(scope.ProjectId);

            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathInScopeAsync(own, path.PathId);
            hops.Should().NotBeEmpty();

            IReadOnlyList<Guid> linkedFindings =
                await findingRepository.ListFindingIdsByPathIdInScopeAsync(own, path.PathId);
            linkedFindings.Should().NotBeEmpty(
                "each materialized privilege path should have an operational finding");

            ProjectScopeKey otherProject = ProjectScopeKey.Create(
                scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
            ProjectScopeKey otherWorkspace = ProjectScopeKey.Create(
                scope.TenantId, Guid.NewGuid(), scope.ProjectId);
            ProjectScopeKey otherTenant = ProjectScopeKey.Create(
                Guid.NewGuid(), scope.WorkspaceId, scope.ProjectId);

            foreach (ProjectScopeKey foreign in new[] { otherProject, otherWorkspace, otherTenant })
            {
                (await pathRepository.ListBySnapshotAsync(
                    ProjectSnapshotScopeKey.Create(foreign, snapshotId))).Should().BeEmpty();

                (await findingRepository.ListFindingIdsByPathIdInScopeAsync(
                    foreign, path.PathId)).Should().BeEmpty();

                (await pathRepository.TryGetByIdInScopeAsync(
                    foreign, path.PathId)).Should().BeNull();
            }
        }

        PrivilegePathEngineResult second = await engine.RunAsync(
            scope, snapshotId, SecureNowArchitectConstants.SystemActorId);

        second.Succeeded.Should().BeTrue(second.ErrorMessage);
        second.PathsPersisted.Should().Be(0,
            "replaying the same snapshot must not create duplicate paths");
        second.FindingsDeduplicated.Should().BeGreaterThan(0,
            "replay must preserve finding identity rather than duplicating findings");

        (await pathRepository.ListBySnapshotAsync(ownSnapshot)).Should().HaveCount(paths.Count);
    }

    private static byte[] CreateSyntheticZip(string subscriptionId, string armId)
    {
        using MemoryStream result = new();
        using (ZipArchive archive = new(result, ZipArchiveMode.Create, leaveOpen: true))
        {
            Write(archive, "manifest.json",
                $$"""
                  {
                    "schemaVersion": 2,
                    "scriptVersion": "securenow-sql-privilege-test",
                    "collectionTimestamp": "2026-11-01T00:00:00Z",
                    "subscriptionId": "{{subscriptionId}}",
                    "scope": "/subscriptions/{{subscriptionId}}",
                    "switchesUsed": [],
                    "azModuleVersion": "test"
                  }
                  """);
            Write(archive, "resources.json",
                $$"""
                  [{
                    "resourceId":"{{armId}}",
                    "resourceType":"Microsoft.Storage/storageAccounts",
                    "name":"securelab",
                    "resourceGroup":"rg-lab",
                    "location":"eastus",
                    "properties":{"publicNetworkAccess":"Enabled"},
                    "tags":{"environment":"production"}
                  }]
                  """);
            Write(archive, "role-assignments.json",
                $$"""
                  [{
                    "principalId":"{{PrincipalId}}",
                    "scope":"{{armId}}",
                    "roleDefinitionId":"{{ContributorRoleDefinitionId}}"
                  }]
                  """);
        }
        return result.ToArray();
    }

    private static void Write(ZipArchive archive, string name, string body)
    {
        using StreamWriter writer = new(
            archive.CreateEntry(name).Open(), new UTF8Encoding(false));
        writer.Write(body);
    }
}
