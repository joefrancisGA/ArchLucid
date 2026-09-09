using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Category", "Unit")]
public sealed class DiagramDeclarationOmissionFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_emits_contradiction_with_evidence_on_both_sides()
    {
        GraphSnapshot graph = GoldenCorpusDiagramDeclarationOmissionGraphFactory.CreateDiagramDeclarationOmissionGraph();
        DiagramDeclarationOmissionFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("diagram-declaration-omission");
        finding.RelatedNodeIds.Should().Contain("diagram-node:api");
        finding.RelatedNodeIds.Should().Contain("obj-payments-kv");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:diagram-node:api");
        finding.Trace!.Notes.Should().Contain("evidence:graph-node:obj-payments-kv");

        DiagramDeclarationOmissionFindingPayload payload =
            finding.Payload.Should().BeOfType<DiagramDeclarationOmissionFindingPayload>().Subject;

        payload.OmittedDeclarationNodeId.Should().Be("obj-payments-kv");
    }
}
