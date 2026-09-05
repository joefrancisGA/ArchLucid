using ArchLucid.Application.InfraEvidence.DiagramReconciliation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.InfraEvidence;
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
