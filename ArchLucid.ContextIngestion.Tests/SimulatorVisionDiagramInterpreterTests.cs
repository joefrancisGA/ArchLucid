using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.ContextIngestion.Tests;

[Trait("Suite", "Core")]
public sealed class SimulatorVisionDiagramInterpreterTests
{
    [Fact]
    public void Interpret_returns_low_confidence_vision_ai_provenance()
    {
        SimulatorVisionDiagramInterpreter interpreter = new();

        VisionDiagramInterpretationResult result = interpreter.Interpret(new VisionDiagramIngestRequest
        {
            Name = "fixture.png",
            Format = DiagramSourceFormats.Png,
            ContentBase64 = "aGVsbG8=",
            UseSimulator = true,
        });

        result.InterpretationConfidence.Should().Be(SimulatorVisionDiagramInterpreter.SimulatorConfidence);
        result.Model.Nodes.Should().NotBeEmpty();
        result.Model.Nodes.Should().OnlyContain(node =>
            string.Equals(node.Provenance, ArchitectureDiagramProvenanceKinds.VisionAi, StringComparison.Ordinal));
        result.Warnings.Should().Contain(VisionDiagramHonestyLabels.InterpretationDisclaimer);
    }
}
