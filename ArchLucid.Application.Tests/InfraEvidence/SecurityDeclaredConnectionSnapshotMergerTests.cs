using ArchLucid.Application.InfraEvidence.SecurityDeclaredConnections;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecurityDeclaredConnectionSnapshotMergerTests
{
    private static readonly Guid FromCloudResourceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ToCloudResourceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private const string FromArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
    private const string ToArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";

    [Fact]
    public void Merge_adds_human_assertion_edge_when_resources_exist_in_snapshot()
    {
        DateTime utcNow = DateTime.UtcNow;
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();

        SecurityDeclaredConnectionRecord connection = new()
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FromCloudResourceId = FromCloudResourceId,
            ToCloudResourceId = ToCloudResourceId,
            RelationshipType = SecurityDeclaredConnectionRelationshipType.ConnectsTo,
            Rationale = "Connection string in appsettings references this SQL server.",
            ExpirationUtc = utcNow.AddDays(30),
            Status = SecurityDeclaredConnectionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [],
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        AzureInventorySnapshotDetailReadModel merged =
            SecurityDeclaredConnectionSnapshotMerger.Merge(snapshot, [connection], utcNow);

        merged.Relationships.Should().ContainSingle(relationship =>
            relationship.FromAzureResourceId == FromArm
            && relationship.ToAzureResourceId == ToArm
            && relationship.RelationshipType == GraphEdgeTypes.ConnectsTo
            && relationship.ProvenanceKind == ProvenanceKind.HumanAssertion
            && relationship.InferenceSource == GraphEdgeInferenceSources.HumanDeclaredConnection);
    }

    [Fact]
    public void Merge_skips_connection_when_endpoint_not_in_snapshot()
    {
        DateTime utcNow = DateTime.UtcNow;
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();

        SecurityDeclaredConnectionRecord connection = new()
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FromCloudResourceId = FromCloudResourceId,
            ToCloudResourceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            RelationshipType = SecurityDeclaredConnectionRelationshipType.DependsOn,
            Rationale = "Missing target in this snapshot.",
            ExpirationUtc = utcNow.AddDays(30),
            Status = SecurityDeclaredConnectionStatus.Active,
            RequestedByActorKey = "requester",
            ApprovedByActorKey = "approver",
            PayloadHashSha256 = [],
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        AzureInventorySnapshotDetailReadModel merged =
            SecurityDeclaredConnectionSnapshotMerger.Merge(snapshot, [connection], utcNow);

        merged.Relationships.Should().BeEmpty();
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot() =>
        new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
                SubscriptionId = "sub",
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    CloudResourceId = FromCloudResourceId,
                    AzureResourceId = FromArm,
                    ResourceType = "Microsoft.Web/sites",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    CloudResourceId = ToCloudResourceId,
                    AzureResourceId = ToArm,
                    ResourceType = "Microsoft.Sql/servers",
                    SubscriptionId = "sub",
                },
            ],
        };
}
