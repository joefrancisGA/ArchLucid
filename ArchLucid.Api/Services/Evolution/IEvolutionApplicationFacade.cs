using ArchLucid.Api.Models.Evolution;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Api.Services.Evolution;

public interface IEvolutionApplicationFacade
{
    Task<EvolutionCandidateReadBundle?> TryLoadCandidateBundleAsync(
        Guid candidateId,
        ProductLearningScope scope,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<EvolutionCandidateChangeSetRecord>> ListCandidatesAsync(
        ProductLearningScope scope,
        int take,
        CancellationToken cancellationToken);

    Task<EvolutionResultsResponse?> TryBuildResultsResponseAsync(
        Guid candidateId,
        ProductLearningScope scope,
        CancellationToken cancellationToken);

    Task<EvolutionCandidateDetailResponse?> TryBuildCandidateDetailResponseAsync(
        Guid candidateId,
        ProductLearningScope scope,
        CancellationToken cancellationToken);

    Task<EvolutionExportResults?> TryBuildExportResultsAsync(
        Guid candidateId,
        string formatNorm,
        ProductLearningScope scope,
        CancellationToken cancellationToken);
}
