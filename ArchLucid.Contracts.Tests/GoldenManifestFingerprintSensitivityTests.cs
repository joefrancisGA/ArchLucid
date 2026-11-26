using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GoldenManifestFingerprintSensitivityTests
{
    public enum StructuralField
    {
        ServiceId,
        ServiceName,
        ServiceType,
        ServicePlatform,
        ServicePurpose,
        ServiceInstanceCount,
        ServiceRegion,
        ServiceSku,
        ServiceTags,
        DatastoreName,
        DatastoreType,
        DatastorePurpose,
        RelationshipId,
        RelationshipSource,
        RelationshipTarget,
        RelationshipType,
        RelationshipDescription,
    }

    [Theory]
    [InlineData(StructuralField.ServiceId)]
    [InlineData(StructuralField.ServiceName)]
    [InlineData(StructuralField.ServiceType)]
    [InlineData(StructuralField.ServicePlatform)]
    [InlineData(StructuralField.ServicePurpose)]
    [InlineData(StructuralField.ServiceInstanceCount)]
    [InlineData(StructuralField.ServiceRegion)]
    [InlineData(StructuralField.ServiceSku)]
    [InlineData(StructuralField.ServiceTags)]
    [InlineData(StructuralField.DatastoreName)]
    [InlineData(StructuralField.DatastoreType)]
    [InlineData(StructuralField.DatastorePurpose)]
    [InlineData(StructuralField.RelationshipId)]
    [InlineData(StructuralField.RelationshipSource)]
    [InlineData(StructuralField.RelationshipTarget)]
    [InlineData(StructuralField.RelationshipType)]
    [InlineData(StructuralField.RelationshipDescription)]
    public void Content_fingerprint_detects_one_structural_change(StructuralField field)
    {
        GoldenManifest original = CreateManifest();
        GoldenManifest updated = CreateManifest();
        ManifestService service = updated.Services[0];
        ManifestDatastore datastore = updated.Datastores[0];
        ManifestRelationship relationship = updated.Relationships[0];

        switch (field)
        {
            case StructuralField.ServiceId:
                // This node is not referenced by another row. The new ID also retains its sort position.
                updated.Services[1].ServiceId = "scheduler-v2";
                break;
            case StructuralField.ServiceName:
                service.ServiceName = "Ordering API";
                break;
            case StructuralField.ServiceType:
                service.ServiceType = ServiceType.Worker;
                break;
            case StructuralField.ServicePlatform:
                service.RuntimePlatform = RuntimePlatform.ContainerApps;
                break;
            case StructuralField.ServicePurpose:
                service.Purpose = "Accept customer returns";
                break;
            case StructuralField.ServiceInstanceCount:
                service.InstanceCount = 3;
                break;
            case StructuralField.ServiceRegion:
                service.AzureArmRegion = "westus2";
                break;
            case StructuralField.ServiceSku:
                service.AzurePricingSku = "P2v3";
                break;
            case StructuralField.ServiceTags:
                service.Tags.Add("returns");
                break;
            case StructuralField.DatastoreName:
                datastore.DatastoreName = "Order ledger";
                break;
            case StructuralField.DatastoreType:
                datastore.DatastoreType = DatastoreType.NoSql;
                break;
            case StructuralField.DatastorePurpose:
                datastore.Purpose = "Record completed returns";
                break;
            case StructuralField.RelationshipId:
                relationship.RelationshipId = "orders-v2";
                break;
            case StructuralField.RelationshipSource:
                relationship.SourceId = "scheduler";
                break;
            case StructuralField.RelationshipTarget:
                relationship.TargetId = "store-archive";
                break;
            case StructuralField.RelationshipType:
                relationship.RelationshipType = RelationshipType.ReadsFrom;
                break;
            case StructuralField.RelationshipDescription:
                relationship.Description = "Retain a copy of every order";
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(field), field, null);
        }

        GoldenManifestFingerprint.ComputeContentSha256Hex(updated)
            .Should().NotBe(GoldenManifestFingerprint.ComputeContentSha256Hex(original));
    }

    public enum CollectionOrder
    {
        Services,
        Datastores,
        Relationships,
        ServiceTags,
    }

    [Theory]
    [InlineData(CollectionOrder.Services)]
    [InlineData(CollectionOrder.Datastores)]
    [InlineData(CollectionOrder.Relationships)]
    [InlineData(CollectionOrder.ServiceTags)]
    public void Content_fingerprint_ignores_order_without_ignoring_content(CollectionOrder collection)
    {
        GoldenManifest original = CreateManifest();
        GoldenManifest reordered = CreateManifest();

        switch (collection)
        {
            case CollectionOrder.Services:
                reordered.Services.Reverse();
                break;
            case CollectionOrder.Datastores:
                reordered.Datastores.Reverse();
                break;
            case CollectionOrder.Relationships:
                reordered.Relationships.Reverse();
                break;
            case CollectionOrder.ServiceTags:
                reordered.Services[0].Tags.Reverse();
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(collection), collection, null);
        }

        GoldenManifestFingerprint.ComputeContentSha256Hex(reordered)
            .Should().Be(GoldenManifestFingerprint.ComputeContentSha256Hex(original));
    }

    private static GoldenManifest CreateManifest() =>
        new()
        {
            RunId = "run-orders",
            SystemName = "Order processing",
            Services =
            [
                new ManifestService
                {
                    ServiceId = "api",
                    ServiceName = "Orders API",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                    Purpose = "Accept new orders",
                    AzureArmRegion = "eastus",
                    AzurePricingSku = "P1v3",
                    InstanceCount = 2,
                    Tags = ["orders", "production"],
                },
                new ManifestService { ServiceId = "scheduler", ServiceName = "Scheduler", ServiceType = ServiceType.Worker },
                new ManifestService { ServiceId = "worker", ServiceName = "Archival worker", ServiceType = ServiceType.Worker },
            ],
            Datastores =
            [
                new ManifestDatastore
                {
                    DatastoreId = "store-primary",
                    DatastoreName = "Order store",
                    DatastoreType = DatastoreType.Sql,
                    Purpose = "Record new orders",
                },
                new ManifestDatastore { DatastoreId = "store-archive", DatastoreName = "Archive", DatastoreType = DatastoreType.Object },
            ],
            Relationships =
            [
                new ManifestRelationship
                {
                    RelationshipId = "orders",
                    SourceId = "api",
                    TargetId = "store-primary",
                    RelationshipType = RelationshipType.WritesTo,
                    Description = "Record incoming orders",
                },
                new ManifestRelationship
                {
                    RelationshipId = "records",
                    SourceId = "worker",
                    TargetId = "store-archive",
                    RelationshipType = RelationshipType.WritesTo,
                },
            ],
            Metadata = new ManifestMetadata
            {
                ManifestVersion = "v1",
                CreatedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            },
        };
}
