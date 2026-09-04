using System.IO.Compression;
using System.Text;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
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
        string childArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        string normalizedChildArmId = ArmResourceIdNormalizer.Normalize(childArmId);
        string parentArmId = normalizedChildArmId[..normalizedChildArmId.LastIndexOf('/')];

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
        captured!.Relationships.Should().ContainSingle(r =>
            r.FromAzureResourceId == parentArmId
            && r.ToAzureResourceId == normalizedChildArmId
            && r.RelationshipType == "contains"
            && r.ProvenanceKind == ProvenanceKind.ObservedFact);
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
    public async Task TryMaterializePackageAsync_writes_logsTo_relationship_from_diagnostic_settings()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid snapshotId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();
        string targetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
        string workspaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/log1";
        string normalizedTargetId = ArmResourceIdNormalizer.Normalize(targetId);
        string normalizedWorkspaceId = ArmResourceIdNormalizer.Normalize(workspaceId);

        AzureInventorySnapshotMaterializeWriteRequest? captured = null;
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = CreateSnapshotRepository(
            scope,
            snapshotId,
            request => captured = request);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = CreateIdentityDirectory(scope, snapshotId);

        byte[] zipBytes = BuildZipWithDiagnostics(
            "[]",
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
        captured!.Relationships.Should().Contain(r =>
            r.FromAzureResourceId == normalizedTargetId
            && r.ToAzureResourceId == normalizedWorkspaceId
            && r.RelationshipType == "logsTo"
            && r.ProvenanceKind == ProvenanceKind.ObservedFact);
    }

    private static Mock<IAzureInventorySnapshotRepository> CreateSnapshotRepository(
        ScopeContext scope,
        Guid snapshotId,
        Action<AzureInventorySnapshotMaterializeWriteRequest> onMaterialize)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();

        snapshotRepository
            .Setup(r => r.TryGetBySnapshotIdAsync(scope, snapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = scope.TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Pending,
            });

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

    private static byte[] BuildZip(string resourcesJson)
    {
        using MemoryStream ms = new();

        using (ZipArchive archive = new(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            ZipArchiveEntry entry = archive.CreateEntry(AzureExtractorPackageZipEntryNames.Resources);
            using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
            writer.Write(resourcesJson);
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
