using System.Reflection;

using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     Guards <see cref="GraphSnapshot" /> v1 public contract — bump <see cref="GraphSnapshot.SchemaVersion" /> when changing surface.
/// </summary>
[Trait("Category", "Unit")]
public sealed class GraphSnapshotSchemaStabilityTests
{
    private static readonly string[] GraphSnapshotPropertyNames =
    [
        "SchemaVersion",
        "GraphSnapshotId",
        "ContextSnapshotId",
        "RunId",
        "CreatedUtc",
        "Nodes",
        "Edges",
        "Warnings",
    ];

    private static readonly string[] GraphNodePropertyNames =
    [
        "NodeId",
        "NodeType",
        "Label",
        "Category",
        "SourceType",
        "SourceId",
        "Properties",
        "ReasoningTrace",
    ];

    private static readonly string[] GraphEdgePropertyNames =
    [
        "EdgeId",
        "FromNodeId",
        "ToNodeId",
        "EdgeType",
        "Label",
        "Weight",
        "InferenceSource",
        "Properties",
        "ReasoningTrace",
    ];

    [Fact]
    public void GraphSnapshot_DefaultSchemaVersion_IsOne()
    {
        GraphSnapshot snapshot = new();

        snapshot.SchemaVersion.Should().Be(1);
    }

    [Fact]
    public void GraphSnapshot_PublicProperties_MatchShippedV1Contract()
    {
        AssertPropertySurfaceMatches(typeof(GraphSnapshot), GraphSnapshotPropertyNames);
    }

    [Fact]
    public void GraphNode_PublicProperties_MatchShippedV1Contract()
    {
        AssertPropertySurfaceMatches(typeof(GraphNode), GraphNodePropertyNames);
    }

    [Fact]
    public void GraphEdge_PublicProperties_MatchShippedV1Contract()
    {
        AssertPropertySurfaceMatches(typeof(GraphEdge), GraphEdgePropertyNames);
    }

    private static void AssertPropertySurfaceMatches(Type contractType, IReadOnlyList<string> expectedNames)
    {
        string[] actual = contractType
            .GetProperties(BindingFlags.Instance | BindingFlags.Public)
            .Select(static property => property.Name)
            .OrderBy(static name => name, StringComparer.Ordinal)
            .ToArray();

        actual.Should().BeEquivalentTo(
            expectedNames.OrderBy(static name => name, StringComparer.Ordinal),
            $"Public surface of {contractType.Name} changed without a SchemaVersion bump.");
    }
}
