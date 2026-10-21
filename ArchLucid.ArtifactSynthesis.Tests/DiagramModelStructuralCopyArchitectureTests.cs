using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Architecture")]
public sealed class DiagramModelStructuralCopyArchitectureTests
{
    [Fact]
    public void Exemptions_document_every_rebuild_path()
    {
        HashSet<string> documented = DiagramModelStructuralCopyExemptions.PropertyExemptions.Keys.ToHashSet(StringComparer.Ordinal);
        IEnumerable<string> expected = DiagramModelRebuildPathInvoker.NodeRebuildPathIds()
            .Concat(DiagramModelRebuildPathInvoker.EdgeRebuildPathIds())
            .Concat(DiagramModelRebuildPathInvoker.SubgraphRebuildPathIds())
            .Concat(DiagramModelRebuildPathInvoker.AstRebuildPathIds());

        foreach (string pathId in expected)
        {
            documented.Should().Contain(pathId, $"rebuild path {pathId} must have exemption documentation");
        }
    }

    [Theory]
    [MemberData(nameof(NodeRebuildPathIds))]
    public void Node_rebuild_paths_preserve_non_exempt_properties(string rebuildPathId)
    {
        DiagramNode source = DiagramModelPropertyProbeFactory.CreatePopulatedDiagramNode();
        DiagramNode rebuilt = DiagramModelRebuildPathInvoker.InvokeNodePath(rebuildPathId, source);
        IReadOnlySet<string> exemptions = DiagramModelStructuralCopyExemptions.PropertyExemptions[rebuildPathId];

        IReadOnlyList<string> mismatches =
            DiagramModelPropertyProbeFactory.GetMismatchedPropertyNames(source, rebuilt, exemptions);

        mismatches.Should().BeEmpty($"rebuild path {rebuildPathId} dropped or altered unexpected fields: {string.Join(", ", mismatches)}");
    }

    [Theory]
    [MemberData(nameof(EdgeRebuildPathIds))]
    public void Edge_rebuild_paths_preserve_non_exempt_properties(string rebuildPathId)
    {
        DiagramEdge source = DiagramModelPropertyProbeFactory.CreatePopulatedDiagramEdge();
        DiagramEdge rebuilt = DiagramModelRebuildPathInvoker.InvokeEdgePath(rebuildPathId, source);
        IReadOnlySet<string> exemptions = DiagramModelStructuralCopyExemptions.PropertyExemptions[rebuildPathId];

        IReadOnlyList<string> mismatches =
            DiagramModelPropertyProbeFactory.GetMismatchedPropertyNames(source, rebuilt, exemptions);

        mismatches.Should().BeEmpty($"rebuild path {rebuildPathId} dropped or altered unexpected fields: {string.Join(", ", mismatches)}");
    }

    [Theory]
    [MemberData(nameof(SubgraphRebuildPathIds))]
    public void Subgraph_rebuild_paths_preserve_non_exempt_properties(string rebuildPathId)
    {
        DiagramSubgraph source = DiagramModelPropertyProbeFactory.CreatePopulatedDiagramSubgraph();
        DiagramSubgraph rebuilt = DiagramModelRebuildPathInvoker.InvokeSubgraphPath(rebuildPathId, source);
        IReadOnlySet<string> exemptions = DiagramModelStructuralCopyExemptions.PropertyExemptions[rebuildPathId];

        IReadOnlyList<string> mismatches =
            DiagramModelPropertyProbeFactory.GetMismatchedPropertyNames(source, rebuilt, exemptions);

        mismatches.Should().BeEmpty($"rebuild path {rebuildPathId} dropped or altered unexpected fields: {string.Join(", ", mismatches)}");
    }

    [Theory]
    [MemberData(nameof(AstRebuildPathIds))]
    public void Ast_rebuild_paths_preserve_non_exempt_scalar_collections(string rebuildPathId)
    {
        DiagramAst source = DiagramModelPropertyProbeFactory.CreatePopulatedDiagramAst();
        DiagramAst rebuilt = DiagramModelRebuildPathInvoker.InvokeAstPath(rebuildPathId, source);
        IReadOnlySet<string> exemptions = DiagramModelStructuralCopyExemptions.PropertyExemptions[rebuildPathId];

        IReadOnlyList<string> mismatches =
            DiagramModelPropertyProbeFactory.GetMismatchedPropertyNames(source, rebuilt, exemptions);

        mismatches.Should().BeEmpty($"rebuild path {rebuildPathId} dropped or altered unexpected AST fields: {string.Join(", ", mismatches)}");
    }

    public static IEnumerable<object[]> NodeRebuildPathIds() =>
        DiagramModelRebuildPathInvoker.NodeRebuildPathIds().Select(id => new object[] { id });

    public static IEnumerable<object[]> EdgeRebuildPathIds() =>
        DiagramModelRebuildPathInvoker.EdgeRebuildPathIds().Select(id => new object[] { id });

    public static IEnumerable<object[]> SubgraphRebuildPathIds() =>
        DiagramModelRebuildPathInvoker.SubgraphRebuildPathIds().Select(id => new object[] { id });

    public static IEnumerable<object[]> AstRebuildPathIds() =>
        DiagramModelRebuildPathInvoker.AstRebuildPathIds().Select(id => new object[] { id });
}
