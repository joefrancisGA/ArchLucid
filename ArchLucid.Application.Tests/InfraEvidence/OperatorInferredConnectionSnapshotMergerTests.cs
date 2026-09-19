using ArchLucid.Application.InfraEvidence.OperatorInferredConnections;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class OperatorInferredConnectionSnapshotMergerTests
{
    private static readonly Guid FromCloudResourceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ToCloudResourceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private const string FromArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/archlucid-ui";
    private const string ToArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1/databases/archlucidtenantedev";

    [Fact]
    public void Merge_adds_human_assertion_edge_for_confirmed_connections()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();
        OperatorInferredConnectionRecord connection = new()
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SnapshotId = snapshot.Header.SnapshotId,
            Status = OperatorInferredConnectionStatus.Confirmed,
            Source = OperatorInferredConnectionSource.Questionnaire,
            FromCloudResourceId = FromCloudResourceId,
            ToCloudResourceId = ToCloudResourceId,
            ProposalPayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        AzureInventorySnapshotDetailReadModel merged =
            OperatorInferredConnectionSnapshotMerger.Merge(snapshot, [connection]);

        merged.Relationships.Should().ContainSingle(relationship =>
            relationship.FromAzureResourceId == FromArm
            && relationship.ToAzureResourceId == ToArm
            && relationship.ProvenanceKind == ProvenanceKind.HumanAssertion
            && relationship.InferenceSource == GraphEdgeInferenceSources.OperatorConfirmedConnection
            && relationship.DeclaredConnectionId == connection.ConnectionId);
    }

    [Fact]
    public void Merge_omits_dismissed_connections()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot();
        OperatorInferredConnectionRecord connection = new()
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            SnapshotId = snapshot.Header.SnapshotId,
            Status = OperatorInferredConnectionStatus.Dismissed,
            Source = OperatorInferredConnectionSource.Upload,
            FromCloudResourceId = FromCloudResourceId,
            ToCloudResourceId = ToCloudResourceId,
            ProposalPayloadHashSha256 = [],
            CreatedUtc = DateTime.UtcNow,
            UpdatedUtc = DateTime.UtcNow,
        };

        AzureInventorySnapshotDetailReadModel merged =
            OperatorInferredConnectionSnapshotMerger.Merge(snapshot, [connection]);

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
                    ResourceType = "Microsoft.App/containerApps",
                    SubscriptionId = "sub",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    CloudResourceId = ToCloudResourceId,
                    AzureResourceId = ToArm,
                    ResourceType = "Microsoft.Sql/servers/databases",
                    SubscriptionId = "sub",
                },
            ],
        };
}
