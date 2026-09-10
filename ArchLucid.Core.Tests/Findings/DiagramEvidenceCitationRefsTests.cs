using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DiagramEvidenceCitationRefsTests
{
    [Fact]
    public void TryParse_parses_diagram_citation_grammar()
    {
        bool parsed = DiagramEvidenceCitationRefs.TryParse(
            "diagram:evidence-diagram-1:api",
            out DiagramEvidenceCitation? citation);

        parsed.Should().BeTrue();
        citation!.EvidenceItemId.Should().Be("evidence-diagram-1");
        citation.ShapeOrEdgeId.Should().Be("api");
    }

    [Fact]
    public void HasConcreteEvidenceCitation_accepts_present_shape_id_on_package()
    {
        DiagramPackageCitationIndex packageIndex = BuildPackageIndex("evidence-diagram-1", "api", "sql");

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(
                ["diagram:evidence-diagram-1:api"],
                packageIndex)
            .Should().BeTrue();
    }

    [Fact]
    public void HasConcreteEvidenceCitation_rejects_dangling_shape_id()
    {
        DiagramPackageCitationIndex packageIndex = BuildPackageIndex("evidence-diagram-1", "api");

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(
                ["diagram:evidence-diagram-1:missing"],
                packageIndex)
            .Should().BeFalse();
    }

    [Fact]
    public void HasConcreteEvidenceCitation_rejects_diagram_ref_without_package_index()
    {
        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(["diagram:evidence-diagram-1:api"])
            .Should().BeFalse();
    }

    [Fact]
    public void HasConcreteEvidenceCitation_rejects_wrong_evidence_item_scope()
    {
        DiagramPackageCitationIndex packageIndex = BuildPackageIndex("evidence-diagram-1", "api");

        GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(
                ["diagram:other-evidence:api"],
                packageIndex)
            .Should().BeFalse();
    }

    private static DiagramPackageCitationIndex BuildPackageIndex(
        string evidenceItemId,
        params string[] shapeOrEdgeIds)
    {
        ArchitectureDiagramModelRecord model = new()
        {
            SourceEvidenceItemId = evidenceItemId,
            Nodes = shapeOrEdgeIds
                .Select(shapeId => new ArchitectureDiagramNodeRecord
                {
                    Id = shapeId,
                    Label = shapeId,
                })
                .ToList(),
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        return DiagramPackageCitationIndex.FromModels([model]);
    }
}
