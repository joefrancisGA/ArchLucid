namespace ArchLucid.Contracts.Evolution;

/// <summary>Input to <c>ISimulationEngine.SimulateAsync</c>; carries review context and baseline run id (no mutation).</summary>
public sealed class SimulationRequest
{
    public required CandidateChangeSet CandidateChangeSet { get; init; }

    public required string BaselineArchitectureRunId { get; init; }

    public SimulationEngineOptions? Options { get; init; }
}
