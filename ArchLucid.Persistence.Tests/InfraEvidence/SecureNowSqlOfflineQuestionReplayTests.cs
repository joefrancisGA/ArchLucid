using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

/// <summary>
/// SQL-backed, strictly offline integration of existing SecureNow materialization and
/// question generation. No Azure client, HTTP client or production database is used by
/// the test; the SQL fixture owns the already-migrated test catalog.
/// This does not claim policy-pack, persisted-inference or path-engine replay.
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SecureNowSqlOfflineQuestionReplayTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Real_sql_materialization_reproduces_native_zip_questions_and_isolates_scope()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string subscriptionId = Guid.NewGuid().ToString("D");
        const string resourceType = "Microsoft.Web/sites";
        string armId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg-lab/providers/Microsoft.Web/sites/app-lab";
        byte[] zip = BuildZip(subscriptionId, armId, resourceType);

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid packageId = Guid.NewGuid();
        Guid snapshotId = Guid.NewGuid();
        DateTime createdUtc = DateTime.UtcNow;

        SqlConnectionFactory factory = new(fixture.ConnectionString);
        SqlAzureExtractorPackageRepository packages = new(factory);
        SqlAzureInventorySnapshotRepository snapshots = new(factory);
        SqlCloudResourceIdentityDirectory identityDirectory = new(factory);
        SqlSecureNowQuestionDispositionRepository dispositions = new(factory);

        await packages.InsertAsync(new AzureExtractorPackageRecord
        {
            PackageId = packageId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CreatedUtc = createdUtc,
            SchemaVersion = 2,
            ScriptVersion = "securenow-offline-test",
            CollectionTimestampUtc = createdUtc,
            SubscriptionId = subscriptionId,
            OriginalFileName = "offline-test.zip",
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
            CreatedUtc = createdUtc,
            UpdatedUtc = createdUtc,
        }, CancellationToken.None);

        Mock<IAzureInventorySnapshotPostMaterializeCoordinator> noPathRunner = new();
        noPathRunner.Setup(x => x.OnSnapshotMaterializedAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        AzureInventorySnapshotMaterializer materializer = new(
            snapshots,
            identityDirectory,
            noPathRunner.Object,
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result =
            await materializer.TryMaterializePackageAsync(
                scope, snapshotId, packageId, zip,
                AzureInventoryCaptureMethod.CustomerScript,
                "securenow-offline-test");

        result.Succeeded.Should().BeTrue(result.ErrorMessage);
        result.ResourceCount.Should().Be(1);
        noPathRunner.Verify(x => x.OnSnapshotMaterializedAsync(
            It.Is<ScopeContext>(actual =>
                actual.TenantId == scope.TenantId &&
                actual.WorkspaceId == scope.WorkspaceId &&
                actual.ProjectId == scope.ProjectId),
            snapshotId,
            subscriptionId,
            It.IsAny<CancellationToken>()), Times.Once);

        SecureNowQuestionDispositionService service = new(
            dispositions, snapshots, Mock.Of<IAuditService>());

        IReadOnlyList<SecureNowQuestionRecord> actual =
            await service.ListQuestionsAsync(scope, snapshotId);

        // Same production ZIP reader + candidate builder + compiler, but without SQL.
        SecureNowOfflineQuestionReplayResult offline =
            SecureNowOfflineQuestionReplay.Replay(zip);

        actual.Should().ContainSingle();
        offline.Questions.Should().ContainSingle();
        actual.Select(q => (q.QuestionKey, q.ResourceId, q.EvidenceFingerprint))
            .Should().Equal(offline.Questions.Select(
                q => (q.QuestionKey, q.ResourceId, q.EvidenceFingerprint)));

        AzureInventorySnapshotDetailReadModel? canonical =
            await snapshots.TryGetCanonicalSnapshotDetailAsync(scope, snapshotId);
        canonical.Should().NotBeNull();
        canonical!.Resources.Should().ContainSingle(
            resource => resource.AzureResourceId == armId.ToLowerInvariant());

        ScopeContext otherProject = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = Guid.NewGuid(),
        };
        ScopeContext otherWorkspace = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = scope.ProjectId,
        };
        ScopeContext otherTenant = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
        };

        foreach (ScopeContext foreign in new[] { otherProject, otherWorkspace, otherTenant })
        {
            (await snapshots.TryGetCanonicalSnapshotDetailAsync(foreign, snapshotId))
                .Should().BeNull("offline replay must not cross project, workspace or tenant boundaries");
            (await service.ListQuestionsAsync(foreign, snapshotId))
                .Should().BeEmpty("a foreign scope cannot generate the original question queue");
        }
    }

    private static byte[] BuildZip(string subscriptionId, string armId, string type)
    {
        using MemoryStream bytes = new();
        using (ZipArchive archive = new(bytes, ZipArchiveMode.Create, leaveOpen: true))
        {
            Write(archive, "manifest.json",
                $$"""
                  {
                    "schemaVersion": 2,
                    "scriptVersion": "securenow-offline-test",
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
                    "resourceId": "{{armId}}",
                    "resourceType": "{{type}}",
                    "name": "app-lab",
                    "location": "eastus",
                    "resourceGroup": "rg-lab",
                    "properties": {}
                  }]
                  """);
        }

        return bytes.ToArray();
    }

    private static void Write(ZipArchive archive, string entry, string text)
    {
        using StreamWriter writer = new(archive.CreateEntry(entry).Open(), new UTF8Encoding(false));
        writer.Write(text);
    }
}
