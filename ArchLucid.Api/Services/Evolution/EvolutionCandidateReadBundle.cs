using ArchLucid.Contracts.Evolution;
using ArchLucid.Persistence.Coordination.Evolution;

namespace ArchLucid.Api.Services.Evolution;

public sealed record EvolutionCandidateReadBundle(
    EvolutionCandidateChangeSetRecord Candidate,
    IReadOnlyList<EvolutionSimulationRunRecord> SimulationRuns);
