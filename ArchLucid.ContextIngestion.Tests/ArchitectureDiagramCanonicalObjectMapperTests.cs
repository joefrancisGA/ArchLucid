using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Diagram;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Category", "Unit")]
public sealed class ArchitectureDiagramCanonicalObjectMapperTests
{
    [Fact]
    public void Map_blank_diagram_label_uses_not_stored_copy_and_zero_inference_confidence()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "/subscriptions/000/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1",
                    Label = "   ",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        IReadOnlyList<CanonicalObject> objects = ArchitectureDiagramCanonicalObjectMapper.Map(
            model,
            "doc-1",
            labelOnlyInferenceConfidence: 0.65);

        objects.Should().ContainSingle();
        CanonicalObject node = objects[0];
        node.Properties["text"].Should().Be(ArchitectureDiagramCanonicalObjectMapper.DiagramNodeLabelNotStoredCopy);
        node.Properties["diagramNodeLabelStored"].Should().Be("false");
        node.Properties["inferenceConfidence"].Should().Be("0");
        node.Properties["labelOnlyInferenceConfidence"].Should().Contain("was not applied");
    }

    [Fact]
    public void Map_inferred_label_stores_label_only_inference_confidence()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "api",
                    Label = "API",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.Inferred,
                },
            ],
            ExtractionMethod = DiagramExtractionMethods.StructuredParse,
        };

        IReadOnlyList<CanonicalObject> objects = ArchitectureDiagramCanonicalObjectMapper.Map(
            model,
            "doc-2",
            labelOnlyInferenceConfidence: 0.5);

        objects[0].Properties["inferenceConfidence"].Should().Be("0.5");
        objects[0].Properties["labelOnlyInferenceConfidence"].Should().Be("0.5");
        objects[0].Properties["diagramNodeLabelStored"].Should().Be("true");
    }
}
