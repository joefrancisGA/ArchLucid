using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Application.Architecture;

/// <inheritdoc/>
public sealed partial class ArchitectureRunProvenanceService(
    IRunDetailQueryService runDetailQueryService,
    IArchitectureRequestRepository requestRepository,
    IEvidenceBundleRepository evidenceBundleRepository,
    IDecisionNodeRepository decisionNodeRepository) : IArchitectureRunProvenanceService
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService.ThrowIfNull();

    private readonly IDecisionNodeRepository
        _decisionNodeRepository = decisionNodeRepository.ThrowIfNull();

    private readonly IEvidenceBundleRepository _evidenceBundleRepository =
        evidenceBundleRepository.ThrowIfNull();

    private readonly IArchitectureRequestRepository _requestRepository = requestRepository.ThrowIfNull();

    /// <inheritdoc/>
    public async Task<ArchitectureRunProvenanceGraph?> GetProvenanceAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArchitectureRunDetail? detail = await _runDetailQueryService.GetRunDetailAsync(runId, cancellationToken);
        if (detail is null)
            return null;
        if (detail.HasBrokenManifestReference)
            return null;
        ArchitectureRequest? request = await _requestRepository.GetByIdAsync(detail.Run.RequestId, cancellationToken);
        EvidenceBundle? bundle = await TryResolveEvidenceBundleAsync(detail, _evidenceBundleRepository, cancellationToken);
        IReadOnlyList<DecisionNode> decisionNodes = DecisionRecordMapper.ToDomain(
            await _decisionNodeRepository.GetByRunIdAsync(runId, cancellationToken));
        return BuildGraph(detail, request, bundle, decisionNodes);
    }

    private static async Task<EvidenceBundle?> TryResolveEvidenceBundleAsync(ArchitectureRunDetail detail, IEvidenceBundleRepository bundles,
        CancellationToken cancellationToken)
    {
        string? bundleRef = detail.Tasks.Select(t => t.EvidenceBundleRef).FirstOrDefault(r => !string.IsNullOrWhiteSpace(r));
        if (string.IsNullOrWhiteSpace(bundleRef))
            return null;
        return await bundles.GetByIdAsync(bundleRef, cancellationToken);
    }
}
