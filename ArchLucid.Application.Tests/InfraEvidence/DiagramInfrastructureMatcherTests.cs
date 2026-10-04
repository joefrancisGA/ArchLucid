using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class DiagramInfrastructureMatcherTests
{
    private static readonly Guid RunId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public void Match_name_type_and_resource_group_exact_maps_to_confirmed()
    {
        Guid resourceRowId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid cloudResourceId = Guid.Parse("22222222-3333-4444-5555-666666666666");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(
                    resourceRowId,
                    cloudResourceId,
                    "sql-db",
                    "rg-data",
                    "Microsoft.Sql/servers/databases"),
            ]);

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "db1",
                    Label = "sql-db (rg-data)",
                },
            ],
        };

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        DiagramInfrastructureCorrespondenceRow row = result.Rows
            .Should()
            .ContainSingle(candidate => candidate.DiagramNodeId == "db1")
            .Subject;

        row.MatchKind.Should().Be(DiagramInfrastructureMatchKinds.Exact);
        row.ConfidenceBand.Should().Be(DiagramInfrastructureConfidenceBands.Confirmed);
        row.CloudResourceId.Should().Be(cloudResourceId);
        row.TerraformAddress.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Match_public_ip_with_private_diagram_label_is_at_least_likely_security_discrepancy()
    {
        Guid resourceRowId = Guid.Parse("33333333-4444-5555-6666-777777777777");
        Guid cloudResourceId = Guid.Parse("44444444-5555-6666-7777-888888888888");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(
                    resourceRowId,
                    cloudResourceId,
                    "gateway",
                    "rg-net",
                    "Microsoft.Network/publicIPAddresses"),
            ]);

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "gw1",
                    Label = "private gateway (rg-net)",
                },
            ],
        };

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        DiagramInfrastructureCorrespondenceRow row = result.Rows
            .Should()
            .ContainSingle(candidate => candidate.DiagramNodeId == "gw1")
            .Subject;

        row.SecurityDiscrepancy.Should().BeTrue();
        row.ConfidenceBand.Should().Be(DiagramInfrastructureConfidenceBands.Likely);
        row.MatchKind.Should().BeOneOf(
            DiagramInfrastructureMatchKinds.Conflict,
            DiagramInfrastructureMatchKinds.Probable,
            DiagramInfrastructureMatchKinds.Possible);
    }

    [Fact]
    public void Match_unmatched_inventory_resource_is_infrastructure_only()
    {
        Guid matchedRowId = Guid.Parse("55555555-6666-7777-8888-999999999999");
        Guid orphanRowId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(
                    matchedRowId,
                    Guid.Parse("77777777-8888-9999-aaaa-bbbbbbbbbbbb"),
                    "api",
                    "rg-core",
                    "Microsoft.Web/sites"),
                CreateResource(
                    orphanRowId,
                    Guid.Parse("99999999-aaaa-bbbb-cccc-dddddddddddd"),
                    "orphan",
                    "rg-core",
                    "Microsoft.Storage/storageAccounts"),
            ]);

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api1",
                    Label = "api (rg-core)",
                },
            ],
        };

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        result.Rows.Should().Contain(row =>
            row.MatchKind == DiagramInfrastructureMatchKinds.InfrastructureOnly
            && row.AzureResourceId!.Contains("orphan", StringComparison.Ordinal));
    }

    [Fact]
    public void Match_saved_mapping_promotes_diagram_only_to_confirmed()
    {
        Guid mappedRowId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444");
        Guid mappedCloudId = Guid.Parse("bbbbbbbb-2222-3333-4444-555555555555");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(
                    mappedRowId,
                    mappedCloudId,
                    "stprodmemberportal01",
                    "rg-app",
                    "Microsoft.Storage/storageAccounts"),
            ]);

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "member-portal",
                    Label = "Member Portal — Prod",
                },
            ],
        };

        IReadOnlyList<InfrastructureDiagramNodeMappingPersistRecord> mappings =
        [
            new InfrastructureDiagramNodeMappingPersistRecord
            {
                MappingId = Guid.NewGuid(),
                TenantId = Guid.Parse("88888888-9999-aaaa-bbbb-cccccccccccc"),
                SnapshotId = SnapshotId,
                NormalizedDiagramLabel = "member portal — prod",
                DiagramNodeId = "member-portal",
                CloudResourceId = mappedCloudId,
                AzureResourceId =
                    "/subscriptions/sub/resourceGroups/rg-app/providers/Microsoft.Storage/storageAccounts/stprodmemberportal01",
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
        ];

        DiagramInfrastructureReconciliationResult withoutMapping = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        withoutMapping.Rows.Should().ContainSingle(row => row.MatchKind == DiagramInfrastructureMatchKinds.DiagramOnly);

        DiagramInfrastructureReconciliationResult withMapping = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId,
            mappings);

        DiagramInfrastructureCorrespondenceRow row = withMapping.Rows
            .Should()
            .ContainSingle(candidate => candidate.DiagramNodeId == "member-portal")
            .Subject;

        row.MatchKind.Should().Be(DiagramInfrastructureMatchKinds.Confirmed);
        withMapping.Rows.Should().NotContain(candidate => candidate.MatchKind == DiagramInfrastructureMatchKinds.InfrastructureOnly);
    }

    [Fact]
    public void Match_drawn_edge_without_inventory_relationship_yields_drawn_not_present_gap()
    {
        Guid leftRowId = Guid.Parse("10101010-2020-3030-4040-505050505050");
        Guid rightRowId = Guid.Parse("60606060-7070-8080-9090-a0a0a0a0a0a0");
        Guid leftCloudId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid rightCloudId = Guid.Parse("22222222-3333-4444-5555-666666666666");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(
                    leftRowId,
                    leftCloudId,
                    "vnet-a",
                    "rg-net",
                    "Microsoft.Network/virtualNetworks"),
                CreateResource(
                    rightRowId,
                    rightCloudId,
                    "vnet-b",
                    "rg-net",
                    "Microsoft.Network/virtualNetworks"),
            ]);

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "a", Label = "vnet-a (rg-net)" },
                new ArchitectureDiagramNodeRecord { Id = "b", Label = "vnet-b (rg-net)" },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "edge-ab",
                    SourceId = "a",
                    TargetId = "b",
                },
            ],
        };

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        result.EdgeGaps.Should().ContainSingle(gap => gap.GapKind == DiagramInfrastructureEdgeGapKinds.DrawnNotPresent);
    }

    [Fact]
    public void Match_vnet_peering_without_diagram_edge_yields_present_not_drawn_gap()
    {
        Guid leftRowId = Guid.Parse("30303030-4040-5050-6060-707070707070");
        Guid rightRowId = Guid.Parse("80808080-9090-a0a0-b0b0-c0c0c0c0c0c0");
        Guid leftCloudId = Guid.Parse("33333333-4444-5555-6666-777777777777");
        Guid rightCloudId = Guid.Parse("44444444-5555-6666-7777-888888888888");
        string leftAzureId =
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-a";
        string rightAzureId =
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-b";

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(leftRowId, leftCloudId, "vnet-a", "rg-net", "Microsoft.Network/virtualNetworks"),
                CreateResource(rightRowId, rightCloudId, "vnet-b", "rg-net", "Microsoft.Network/virtualNetworks"),
            ]);

        snapshot = new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header,
            Resources = snapshot.Resources,
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = leftAzureId,
                    ToAzureResourceId = rightAzureId,
                    RelationshipType = "vnetPeering",
                },
            ],
        };

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "a", Label = "vnet-a (rg-net)" },
                new ArchitectureDiagramNodeRecord { Id = "b", Label = "vnet-b (rg-net)" },
            ],
        };

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        result.EdgeGaps.Should().ContainSingle(gap => gap.GapKind == DiagramInfrastructureEdgeGapKinds.PresentNotDrawn);
    }

    [Fact]
    public void Match_app_authorized_access_relationship_does_not_create_gap()
    {
        Guid leftRowId = Guid.Parse("12121212-2323-3434-4545-565656565656");
        Guid rightRowId = Guid.Parse("67676767-7878-8989-a0a0-b1b1b1b1b1b1");
        Guid leftCloudId = Guid.Parse("55555555-6666-7777-8888-999999999999");
        Guid rightCloudId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(leftRowId, leftCloudId, "api", "rg-core", "Microsoft.Web/sites"),
                CreateResource(rightRowId, rightCloudId, "sql", "rg-data", "Microsoft.Sql/servers/databases"),
            ]);

        string leftAzureId = snapshot.Resources[0].AzureResourceId;
        string rightAzureId = snapshot.Resources[1].AzureResourceId;

        snapshot = new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header,
            Resources = snapshot.Resources,
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = leftAzureId,
                    ToAzureResourceId = rightAzureId,
                    RelationshipType = "appAuthorizedAccess",
                },
            ],
        };

        ArchitectureDiagramModelRecord diagram = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "api1", Label = "api (rg-core)" },
                new ArchitectureDiagramNodeRecord { Id = "db1", Label = "sql (rg-data)" },
            ],
        };

        DiagramInfrastructureReconciliationResult result = DiagramInfrastructureMatcher.Match(
            diagram,
            snapshot,
            RunId,
            SnapshotId);

        result.EdgeGaps.Should().BeEmpty();
    }

    [Fact]
    public void TryApplyAiRationale_rejects_insufficient_to_confirmed_promotion()
    {
        DiagramInfrastructureCorrespondenceRow row = new()
        {
            MatchKind = DiagramInfrastructureMatchKinds.Unknown,
            ConfidenceBand = DiagramInfrastructureConfidenceBands.InsufficientEvidence,
        };

        bool applied = DiagramInfrastructureMatchGuard.TryApplyAiRationale(
            row,
            "Looks like the same resource.",
            DiagramInfrastructureConfidenceBands.Confirmed,
            out string? rejectionReason);

        applied.Should().BeFalse();
        rejectionReason.Should().Contain("InsufficientEvidence");
        row.AiRationale.Should().BeNull();
    }

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord> resources)
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = Guid.Parse("88888888-9999-aaaa-bbbb-cccccccccccc"),
                WorkspaceId = Guid.Parse("99999999-aaaa-bbbb-cccc-dddddddddddd"),
                ProjectId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
                PackageId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
        };
    }

    private static AzureInventoryResourceRecord CreateResource(
        Guid resourceRowId,
        Guid cloudResourceId,
        string resourceName,
        string resourceGroup,
        string resourceType) =>
        new()
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = Guid.Parse("88888888-9999-aaaa-bbbb-cccccccccccc"),
            CloudResourceId = cloudResourceId,
            AzureResourceId =
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/{resourceType}/{resourceName}",
            ResourceType = resourceType,
            ResourceGroup = resourceGroup,
            SubscriptionId = "sub",
        };
}
