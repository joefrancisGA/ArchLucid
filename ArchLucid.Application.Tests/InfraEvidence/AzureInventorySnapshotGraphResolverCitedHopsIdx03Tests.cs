using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverCitedHopsIdx03Tests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    public static TheoryData<DiagramMode> Idx03DiagramModes { get; } = new(
        DiagramMode.Executive,
        DiagramMode.Architecture,
        DiagramMode.Network,
        DiagramMode.Security,
        DiagramMode.Identity,
        DiagramMode.Data,
        DiagramMode.DataFlow,
        DiagramMode.DataArchitecture,
        DiagramMode.FullSubscription,
        DiagramMode.ResourceGroup,
        DiagramMode.SelectedResources,
        DiagramMode.DependencyNeighborhood);

    [Theory]
    [MemberData(nameof(Idx03DiagramModes))]
    public async Task TryResolveGraphAsync_logic_app_star_has_only_cited_connections(DiagramMode mode)
    {
        Guid workflowRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid officeRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        Guid teamsRow = Guid.Parse("11111111-1111-4000-8000-000000000003");
        Guid excelRow = Guid.Parse("11111111-1111-4000-8000-000000000004");
        const string workflowArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/la-notify";
        const string officeArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/office365";
        const string teamsArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/teams";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(workflowRow, workflowArmId, "Microsoft.Logic/workflows"),
                    CreateResource(officeRow, officeArmId, "Microsoft.Web/connections"),
                    CreateResource(
                        teamsRow,
                        teamsArmId,
                        "Microsoft.Web/connections"),
                    CreateResource(
                        excelRow,
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/excel",
                        "Microsoft.Web/connections"),
                ],
                [
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = workflowRow,
                        PropertyKey = "parameters.$connections.value.office365.connectionId",
                        PropertyValue = officeArmId,
                    },
                    new AzureInventoryResourcePropertyReadModel
                    {
                        ResourceRowId = workflowRow,
                        PropertyKey = "parameters.$connections.value.teams.connectionId",
                        PropertyValue = teamsArmId,
                    },
                ],
                []));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges
            .Where(edge => edge.InferenceSource == GraphEdgeInferenceSources.InventoryLogicAppConnection)
            .Should()
            .HaveCount(2);

        DiagramAstCompileOptions? options = mode switch
        {
            DiagramMode.ResourceGroup => new DiagramAstCompileOptions { ResourceGroupName = "rg" },
            DiagramMode.DependencyNeighborhood => new DiagramAstCompileOptions
            {
                NeighborhoodSeedNodeId = result.Graph.Nodes.Single(node => node.Label == "la-notify").NodeId,
            },
            _ => null,
        };

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, mode, options);

        if (mode is DiagramMode.DataFlow
            or DiagramMode.DataArchitecture
            or DiagramMode.Identity
            or DiagramMode.Security
            or DiagramMode.Network
            or DiagramMode.SelectedResources)
        {
            return;
        }

        ast.Nodes.Should().Contain(node => node.Label == "la-notify");
        ast.Edges
            .Where(edge => !edge.IsLayoutOnly
                && edge.InferenceSource == GraphEdgeInferenceSources.InventoryLogicAppConnection)
            .Should()
            .HaveCountLessThanOrEqualTo(2);
        ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .Should()
            .NotContain(edge =>
                string.Equals(edge.InferenceSource, GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.Ordinal)
                && ast.Nodes.Any(node => node.NodeId == edge.ToNodeId && node.Label == "excel"));
    }

    [Fact]
    public async Task TryResolveGraphAsync_two_key_vaults_same_group_have_no_vault_to_vault_edge()
    {
        Guid vaultOneRow = Guid.Parse("22222222-1111-4000-8000-000000000001");
        Guid vaultTwoRow = Guid.Parse("22222222-1111-4000-8000-000000000002");
        const string vaultOneArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-one";
        const string vaultTwoArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-two";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vaultOneRow, vaultOneArmId, "Microsoft.KeyVault/vaults"),
                    CreateResource(vaultTwoRow, vaultTwoArmId, "Microsoft.KeyVault/vaults"),
                ],
                [],
                []));

        result.Succeeded.Should().BeTrue();
        GraphNode vaultOne = result.Graph!.Nodes.Single(node => node.Label == "kv-one");
        GraphNode vaultTwo = result.Graph.Nodes.Single(node => node.Label == "kv-two");
        result.Graph.Edges.Should().NotContain(edge =>
            edge.FromNodeId == vaultOne.NodeId && edge.ToNodeId == vaultTwo.NodeId);
    }

    [Fact]
    public async Task TryResolveGraphAsync_cross_resource_group_edges_require_cited_hops()
    {
        Guid vmRow = Guid.Parse("33333333-1111-4000-8000-000000000001");
        Guid nicRow = Guid.Parse("33333333-1111-4000-8000-000000000002");
        Guid vnetRow = Guid.Parse("33333333-1111-4000-8000-000000000003");
        Guid adfRow = Guid.Parse("33333333-1111-4000-8000-000000000004");
        Guid storageRow = Guid.Parse("33333333-1111-4000-8000-000000000005");
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg-a/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg-a/providers/Microsoft.Network/networkInterfaces/nic1";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg-b/providers/Microsoft.Network/virtualNetworks/vnet-other";
        const string adfArmId =
            "/subscriptions/sub/resourceGroups/rg-a/providers/Microsoft.DataFactory/factories/adf";
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg-b/providers/Microsoft.Storage/storageAccounts/st";

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vmRow, vmArmId, "Microsoft.Compute/virtualMachines", "rg-a"),
                    CreateResource(nicRow, nicArmId, "Microsoft.Network/networkInterfaces", "rg-a"),
                    CreateResource(vnetRow, vnetArmId, "Microsoft.Network/virtualNetworks", "rg-b"),
                    CreateResource(adfRow, adfArmId, "Microsoft.DataFactory/factories", "rg-a"),
                    CreateResource(storageRow, storageArmId, "Microsoft.Storage/storageAccounts", "rg-b"),
                ],
                [],
                [
                    new AzureInventoryResourceRelationshipReadModel
                    {
                        FromAzureResourceId = vmArmId,
                        ToAzureResourceId = nicArmId,
                        InferenceSource = GraphEdgeInferenceSources.InventoryVmNic,
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                    new AzureInventoryResourceRelationshipReadModel
                    {
                        FromAzureResourceId = nicArmId,
                        ToAzureResourceId = vnetArmId,
                        InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                        ProvenanceKind = ProvenanceKind.ObservedFact,
                    },
                ]));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred);
        result.Graph.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryNicSubnet);
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        return await resolver.TryResolveGraphAsync(
            new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            SnapshotId,
            cancellationToken: CancellationToken.None);
    }

    private static AzureInventorySnapshotDetailReadModel CreateSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord> resources,
        IReadOnlyList<AzureInventoryResourcePropertyReadModel> properties,
        IReadOnlyList<AzureInventoryResourceRelationshipReadModel> relationships)
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };
    }

    private static AzureInventoryResourceRecord CreateResource(
        Guid resourceRowId,
        string azureResourceId,
        string resourceType,
        string resourceGroup = "rg")
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = resourceGroup,
            SubscriptionId = "sub",
        };
    }
}
