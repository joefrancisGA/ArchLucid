using ArchLucid.Contracts.Architecture;

namespace ArchLucid.ContextIngestion.Diagram;

/// <summary>Canned low-confidence vision output for tests and simulator mode.</summary>
public sealed class SimulatorVisionDiagramInterpreter : IVisionDiagramInterpreter
{
    public const double SimulatorConfidence = 0.35d;

    public VisionDiagramInterpretationResult Interpret(VisionDiagramIngestRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        ArchitectureDiagramModelRecord model = new()
        {
            Nodes =
            [
                new ArchitectureDiagramNodeRecord
                {
                    Id = "vision-sim-api",
                    Label = "Interpreted API tier",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.VisionAi,
                },
                new ArchitectureDiagramNodeRecord
                {
                    Id = "vision-sim-data",
                    Label = "Interpreted data store",
                    Kind = ArchitectureDiagramNodeKinds.System,
                    Provenance = ArchitectureDiagramProvenanceKinds.VisionAi,
                },
            ],
            Edges =
            [
                new ArchitectureDiagramEdgeRecord
                {
                    Id = "vision-sim-edge-1",
                    SourceId = "vision-sim-api",
                    TargetId = "vision-sim-data",
                    Label = "interpreted flow",
                    Provenance = ArchitectureDiagramProvenanceKinds.VisionAi,
                },
            ],
        };

        List<string> warnings =
        [
            VisionDiagramHonestyLabels.InterpretationDisclaimer,
            "Simulator vision ingest returned a canned low-confidence interpretation.",
            $"Interpretation confidence: {SimulatorConfidence:0.##}.",
        ];

        if (string.IsNullOrWhiteSpace(request.ContentBase64))
        {
            warnings.Add("Image payload was empty; simulator still returned a canned model for honesty testing.");
        }

        return new VisionDiagramInterpretationResult
        {
            Model = model,
            Warnings = warnings,
            InterpretationConfidence = SimulatorConfidence,
        };
    }
}
