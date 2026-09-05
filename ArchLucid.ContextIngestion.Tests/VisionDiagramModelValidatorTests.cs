using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class VisionDiagramModelValidatorTests
{
    [Fact]
    public void TryValidate_valid_model_returns_true()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord { Id = "a", Label = "A" },
                new ArchitectureDiagramNodeRecord { Id = "b", Label = "B" },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "a",
                    TargetId = "b",
                    Label = "flow",
                },
            ],
        };

        bool valid = VisionDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeTrue();
        failureReason.Should().BeNull();
    }

    [Fact]
    public void TryValidate_edge_to_unknown_node_fails_closed()
    {
        ArchitectureDiagramModelRecord model = new()
        {
            Nodes = [new ArchitectureDiagramNodeRecord { Id = "a", Label = "A" }],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "e1",
                    SourceId = "a",
                    TargetId = "missing",
                    Label = "flow",
                },
            ],
        };

        bool valid = VisionDiagramModelValidator.TryValidate(model, out string? failureReason);

        valid.Should().BeFalse();
        failureReason.Should().Contain("unknown node");
    }
}
