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
public sealed class AzureInventorySnapshotGraphResolverRecaptureIdx01Tests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    public static TheoryData<DiagramMode> Idx01DiagramModes { get; } = new(
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
    [MemberData(nameof(Idx01DiagramModes))]
    public async Task TryResolveGraphAsync_recaptured_hops_survive_diagram_mode_compile(DiagramMode mode)
    {
        Guid vmRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid nicRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        Guid peRow = Guid.Parse("11111111-1111-4000-8000-000000000003");
        Guid storageRow = Guid.Parse("11111111-1111-4000-8000-000000000004");
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default";
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";
        const string storageArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        List<AzureInventoryResourceRelationshipReadModel> relationships =
        [
            CreateRelationship(vmArmId, nicArmId, GraphEdgeInferenceSources.InventoryVmNic),
            CreateRelationship(nicArmId, subnetArmId, GraphEdgeInferenceSources.InventoryNicSubnet),
            CreateRelationship(peArmId, storageArmId, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
        ];

        AzureInventorySnapshotGraphResolveResult result = await ResolveAsync(
            CreateSnapshot(
                [
                    CreateResource(vmRow, vmArmId, "Microsoft.Compute/virtualMachines"),
                    CreateResource(nicRow, nicArmId, "Microsoft.Network/networkInterfaces"),
                    CreateResource(peRow, peArmId, "Microsoft.Network/privateEndpoints"),
                    CreateResource(storageRow, storageArmId, "Microsoft.Storage/storageAccounts"),
                ],
                [],
                relationships));

        result.Succeeded.Should().BeTrue();
        result.Graph!.Edges.Should().NotBeEmpty();

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(result.Graph, mode);

        bool expectsVm = mode is DiagramMode.Executive
            or DiagramMode.Architecture
            or DiagramMode.Network
            or DiagramMode.FullSubscription;

        bool expectsStorage = mode is DiagramMode.Executive
            or DiagramMode.Data
            or DiagramMode.DataFlow
            or DiagramMode.DataArchitecture
            or DiagramMode.FullSubscription;

        if (expectsVm)
        {
            ast.Nodes.Should().Contain(node => node.Label == "vm1");
        }
        else
        {
            ast.Nodes.Should().NotContain(node => node.Label == "vm1");
        }

        if (expectsStorage)
        {
            ast.Nodes.Should().Contain(node => node.Label == "sa1");
        }
    }

    private static AzureInventoryResourceRelationshipReadModel CreateRelationship(
        string fromArmId,
        string toArmId,
        string inferenceSource)
    {
        return new AzureInventoryResourceRelationshipReadModel
        {
            FromAzureResourceId = ArmResourceIdNormalizer.Normalize(fromArmId),
            ToAzureResourceId = ArmResourceIdNormalizer.Normalize(toArmId),
            RelationshipType = GraphEdgeTypes.ConnectsTo,
            InferenceSource = inferenceSource,
            ProvenanceKind = ProvenanceKind.ObservedFact,
        };
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetSnapshotDetailAsync(
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

    private static AzureInventoryResourceRecord CreateResource(Guid resourceRowId, string azureResourceId, string resourceType)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }
}
