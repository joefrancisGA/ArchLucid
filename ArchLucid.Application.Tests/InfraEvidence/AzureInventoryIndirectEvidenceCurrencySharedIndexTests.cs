using System.Text.Json;

using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using Xunit;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryIndirectEvidenceCurrencySharedIndexTests
{
    [Theory]
    [InlineData(null, "Current")]
    [InlineData("package", "Current")]
    [InlineData("terraform", "Configured")]
    [InlineData("telemetry", "Observed")]
    public void Shared_index_matches_independent_hydration(string? reference, string expected)
    {
        var (snapshot, independentNode, independentEdge) = AzureInventoryIndirectEvidenceCurrencyTests.Fixture(reference, "telemetry");
        var (_, sharedNode, sharedEdge) = AzureInventoryIndirectEvidenceCurrencyTests.Fixture(reference, "telemetry");
        AzureInventorySnapshotResourceIndex resources = AzureInventorySnapshotResourceIndex.Create(snapshot);
        AzureInventorySnapshotGraphIndexes indexes = AzureInventorySnapshotGraphIndexes.Create(snapshot, [sharedNode]);

        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [independentNode], [independentEdge]);
        AzureInventorySnapshotIndirectRelationshipGraphHydrator.Hydrate(snapshot, [sharedNode], [sharedEdge], indexes, resources);

        Assert.Equal(expected, sharedEdge.Properties[InventoryDiagramIndirectRelationshipPropertyKeys.EvidenceCurrency]);
        Assert.Equal(JsonSerializer.Serialize(independentNode), JsonSerializer.Serialize(sharedNode));
        Assert.Equal(JsonSerializer.Serialize(independentEdge), JsonSerializer.Serialize(sharedEdge));
        Assert.Same(snapshot.Resources[0], resources.ByArmId[ArmResourceIdNormalizer.Normalize(AzureInventoryIndirectEvidenceCurrencyTests.ArmId)]);
    }
}
