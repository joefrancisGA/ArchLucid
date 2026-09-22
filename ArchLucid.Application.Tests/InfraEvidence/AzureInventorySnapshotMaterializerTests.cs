using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotMaterializerTests
{
    [Fact]
    public async Task TryMaterializePackageAsync_writes_contains_relationship_with_observed_fact_provenance()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                "resourceType": "Microsoft.Compute/virtualMachines",
                "name": "vm1",
                "location": "eastus",
                "properties": {}
              }
            ]
            """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.Relationships.Should().BeEmpty(
            "parent-child edges are omitted when the parent ARM id is not itself a visible inventory row");
        captured.RelationshipCount.Should().Be(0);
        result.RelationshipCount.Should().Be(0);
    }

    [Fact]
    public async Task TryMaterializePackageAsync_keeps_unknown_resource_type_in_unknowns()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Unknown/widget1",
                "resourceType": "Microsoft.Unknown/widget",
                "name": "widget1",
                "location": "eastus",
                "isUnknownType": true,
                "properties": { "foo": "bar" }
              }
            ]
            """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.HostedReader,
            "hosted-1",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.UnknownResources.Should().ContainSingle(u =>
            u.ResourceType == "Microsoft.Unknown/widget"
            && u.AzureResourceId.Contains("widget1", StringComparison.Ordinal));
    }

    [Fact]
    public async Task TryMaterializePackageAsync_redacts_secret_property_values_in_write_request()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": { "connectionString": "secret-value" }
              }
            ]
            """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.Properties.Should().ContainSingle(p =>
            p.PropertyKey == "connectionString"
            && p.IsRedacted
            && p.PropertyValue == "[REDACTED]");
    }

    [Fact]
    public async Task TryMaterializePackageAsync_omits_never_show_solutions_and_virtual_network_links()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "location": "eastus",
                "properties": {}
              },
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationsManagement/solutions/Security",
                "resourceType": "Microsoft.OperationsManagement/solutions",
                "name": "Security",
                "location": "eastus",
                "properties": {}
              },
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/zone1/virtualNetworkLinks/link1",
                "resourceType": "",
                "name": "link1",
                "location": "eastus",
                "properties": {}
              }
            ]
            """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.Resources.Should().ContainSingle(resource =>
            resource.ResourceType == "Microsoft.Storage/storageAccounts");
        captured.Resources.Should().NotContain(resource =>
            resource.AzureResourceId.Contains("/solutions/", StringComparison.OrdinalIgnoreCase)
            || resource.AzureResourceId.Contains("/virtualNetworkLinks/", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task TryMaterializePackageAsync_writes_logsTo_relationship_from_diagnostic_settings()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZipWithDiagnostics(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "properties": {}
              }
            ]
            """,
            """
            [
              {
                "targetResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "name": "diag1",
                "workspaceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/log1"
              }
            ]
            """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.Resources.Should().ContainSingle(resource =>
            resource.ResourceType == "Microsoft.Storage/storageAccounts");
        captured.Relationships.Should().BeEmpty(
            "diagnostic edges to omitted Log Analytics workspaces are not attested");
        captured.RelationshipCount.Should().Be(0);
        result.RelationshipCount.Should().Be(0);
    }

    private static Mock<IAzureInventorySnapshotRepository> CreateSnapshotRepository(
        ScopeContext scope,
        Guid snapshotId,
        Action<AzureInventorySnapshotMaterializeWriteRequest> onMaterialize,
        Func<AzureInventorySnapshotRecord, AzureInventorySnapshotRecord>? customizeHeader = null)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();

        AzureInventorySnapshotRecord header = new()
        {
            SnapshotId = snapshotId,
            TenantId = scope.TenantId,
            SubscriptionId = "sub",
            CaptureStatus = AzureInventoryCaptureStatus.Pending,
        };

        if (customizeHeader is not null)
            header = customizeHeader(header);

        snapshotRepository
            .Setup(r => r.TryGetBySnapshotIdAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        snapshotRepository
            .Setup(r => r.MaterializeSnapshotAsync(
                scope,
                snapshotId,
                It.IsAny<AzureInventorySnapshotMaterializeWriteRequest>(),
                It.IsAny<CancellationToken>()))
            .Callback<ScopeContext, Guid, AzureInventorySnapshotMaterializeWriteRequest, CancellationToken>(
                (_, _, request, _) => onMaterialize(request))
            .Returns(Task.CompletedTask);

        return snapshotRepository;
    }

    private static IAzureInventorySnapshotPostMaterializeCoordinator CreateNoOpPostMaterializeCoordinator()
    {
        Mock<IAzureInventorySnapshotPostMaterializeCoordinator> coordinator = new();
        coordinator
            .Setup(c => c.OnSnapshotMaterializedAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        return coordinator.Object;
    }

    private static Mock<ICloudResourceIdentityDirectory> CreateIdentityDirectory(ScopeContext scope, Guid snapshotId)
    {
        Mock<ICloudResourceIdentityDirectory> identityDirectory = new();

        identityDirectory
            .Setup(d => d.UpsertOnSnapshotAsync(
                scope,
                CloudProvider.Azure,
                It.IsAny<string>(),
                snapshotId,
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, CloudProvider _, string externalId, Guid _, string? _, string? _, string? _, string? _, string? _, CancellationToken _) =>
                new CloudResourceIdentityRecord
                {
                    CloudResourceId = Guid.NewGuid(),
                    ExternalResourceIdNormalized = externalId,
                    Provider = CloudProvider.Azure,
                });

        return identityDirectory;
    }

    [Fact]
    public async Task TryMaterializePackageAsync_backfills_subscription_identity_from_manifest()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request,
            _ => new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = scope.TenantId,
                CaptureStatus = AzureInventoryCaptureStatus.Pending,
            });

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZip(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "location": "eastus",
                "properties": {}
              }
            ]
            """,
            subscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
            subscriptionName: "Contoso Production");

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.SubscriptionId.Should().Be("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
        captured.SubscriptionName.Should().Be("Contoso Production");
    }

    private static byte[] BuildZip(
        string resourcesJson,
        string subscriptionId = "sub",
        string? subscriptionName = null)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry manifestEntry = archive.CreateEntry("manifest.json");
            using (StreamWriter manifestWriter = new(manifestEntry.Open(), Encoding.UTF8))
            {
                manifestWriter.Write(
                    $$"""
                    {
                      "schemaVersion": 2,
                      "scriptVersion": "test",
                      "collectionTimestamp": "2026-01-01T00:00:00Z",
                      "subscriptionId": "{{subscriptionId}}",
                      "subscriptionName": {{(subscriptionName is null ? "null" : $"\"{subscriptionName}\"")}},
                      "scope": "/subscriptions/{{subscriptionId}}"
                    }
                    """);
            }

            ZipArchiveEntry entry = archive.CreateEntry(AzureExtractorPackageZipEntryNames.Resources);
            using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
            writer.Write(resourcesJson);
        }

        return ms.ToArray();
    }

    [Fact]
    public async Task TryMaterializePackageAsync_materializes_defender_summary_companion_rows()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZipWithDefenderSummary(
            """
            [
              {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                "resourceType": "Microsoft.Storage/storageAccounts",
                "name": "sa1",
                "location": "eastus",
                "properties": {}
              }
            ]
            """,
            """
            [
              {
                "resourceId": "/subscriptions/sub",
                "secureScore": 72
              }
            ]
            """);

        AzureInventorySnapshotMaterializer sut = new(
            snapshotRepository.Object,
            identityDirectory.Object,
            CreateNoOpPostMaterializeCoordinator(),
            NullLogger<AzureInventorySnapshotMaterializer>.Instance);

        AzureInventorySnapshotMaterializeResult result = await sut.TryMaterializePackageAsync(
            scope,
            snapshotId,
            packageId,
            zipBytes,
            AzureInventoryCaptureMethod.CustomerScript,
            "0.4.0",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        captured.Should().NotBeNull();
        captured!.DefenderSummaries.Should().ContainSingle(row =>
            row.SecureScore == 72
            && row.SourceEvidenceReference == AzureExtractorPackageZipEntryNames.DefenderSummary);
    }

    private static byte[] BuildZipWithDefenderSummary(string resourcesJson, string defenderSummaryJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry resources = archive.CreateEntry(AzureExtractorPackageZipEntryNames.Resources);
            using (StreamWriter writer = new(resources.Open(), Encoding.UTF8))
            {
                writer.Write(resourcesJson);
            }

            ZipArchiveEntry defenderSummary = archive.CreateEntry(AzureExtractorPackageZipEntryNames.DefenderSummary);
            using (StreamWriter writer = new(defenderSummary.Open(), Encoding.UTF8))
            {
                writer.Write(defenderSummaryJson);
            }
        }

        return ms.ToArray();
    }

    private static byte[] BuildZipWithDiagnostics(string resourcesJson, string diagnosticsJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry resources = archive.CreateEntry(AzureExtractorPackageZipEntryNames.Resources);
            using (StreamWriter writer = new(resources.Open(), Encoding.UTF8))
            {
                writer.Write(resourcesJson);
            }

            ZipArchiveEntry diagnostics = archive.CreateEntry(AzureExtractorPackageZipEntryNames.DiagnosticSettings);
            using (StreamWriter writer = new(diagnostics.Open(), Encoding.UTF8))
            {
                writer.Write(diagnosticsJson);
            }
        }

        return ms.ToArray();
    }
}
