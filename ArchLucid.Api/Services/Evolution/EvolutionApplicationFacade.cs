using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Models.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Persistence.Coordination.Evolution;

namespace ArchLucid.Api.Services.Evolution;

public sealed class EvolutionApplicationFacade(
    IEvolutionCandidateChangeSetRepository candidateRepository,
    IEvolutionSimulationRunRepository simulationRunRepository) : IEvolutionApplicationFacade
{
    private static readonly JsonSerializerOptions SimulationReportFileJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = true
    };

    private readonly IEvolutionCandidateChangeSetRepository _candidateRepository =
        candidateRepository ?? throw new ArgumentNullException(nameof(candidateRepository));

    private readonly IEvolutionSimulationRunRepository _simulationRunRepository =
        simulationRunRepository ?? throw new ArgumentNullException(nameof(simulationRunRepository));

    public async Task<EvolutionCandidateReadBundle?> TryLoadCandidateBundleAsync(
        Guid candidateId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        EvolutionCandidateChangeSetRecord? candidate =
            await _candidateRepository.GetByIdAsync(candidateId, scope, cancellationToken);

        if (candidate is null)
            return null;

        IReadOnlyList<EvolutionSimulationRunRecord> simulationRuns =
            await _simulationRunRepository.ListByCandidateAsync(candidateId, cancellationToken);

        return new EvolutionCandidateReadBundle(candidate, simulationRuns);
    }

    public async Task<IReadOnlyList<EvolutionCandidateChangeSetRecord>> ListCandidatesAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken) =>
        await _candidateRepository.ListAsync(scope, take, cancellationToken);

    public async Task<EvolutionResultsResponse?> TryBuildResultsResponseAsync(
        Guid candidateId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        EvolutionCandidateReadBundle? bundle = await TryLoadCandidateBundleAsync(candidateId, scope, cancellationToken);

        if (bundle is null)
            return null;

        return new EvolutionResultsResponse
        {
            Candidate = bundle.Candidate.ToResponse(),
            PlanSnapshotJson = bundle.Candidate.PlanSnapshotJson,
            SimulationRuns = bundle.SimulationRuns.Select(EvolutionOutcomeParser.ToRunWithEvaluation).ToList()
        };
    }

    public async Task<EvolutionCandidateDetailResponse?> TryBuildCandidateDetailResponseAsync(
        Guid candidateId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        EvolutionCandidateReadBundle? bundle = await TryLoadCandidateBundleAsync(candidateId, scope, cancellationToken);

        if (bundle is null)
            return null;

        return new EvolutionCandidateDetailResponse
        {
            Candidate = bundle.Candidate.ToResponse(),
            PlanSnapshotJson = bundle.Candidate.PlanSnapshotJson,
            SimulationRuns = bundle.SimulationRuns.Select(static s => s.ToResponse()).ToList()
        };
    }

    public async Task<EvolutionExportResults?> TryBuildExportResultsAsync(
        Guid candidateId,
        string formatNorm,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        EvolutionCandidateReadBundle? bundle = await TryLoadCandidateBundleAsync(candidateId, scope, cancellationToken);

        if (bundle is null)
            return null;

        EvolutionSimulationReportDocument document =
            EvolutionSimulationReportBuilder.Build(
                bundle.Candidate,
                bundle.SimulationRuns,
                TimeProvider.System.UtcNowDateTime());

        string fileStem = $"evolution-simulation-report-{candidateId:N}";

        if (string.Equals(formatNorm, "json", StringComparison.Ordinal))
        {
            string json = JsonSerializer.Serialize(document, SimulationReportFileJsonOptions);
            return new EvolutionExportResults(json, "application/json", $"{fileStem}.json");
        }

        string markdown = EvolutionSimulationReportMarkdownFormatter.Format(document);
        return new EvolutionExportResults(markdown, "text/markdown", $"{fileStem}.md");
    }
}
