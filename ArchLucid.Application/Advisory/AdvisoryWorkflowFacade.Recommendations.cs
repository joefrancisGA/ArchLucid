using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Advisory;

public sealed partial class AdvisoryWorkflowFacade
{
    public async Task<AdvisoryRecommendationsListResult> ListRecommendationsAsync(
        Guid runId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        IReadOnlyList<RecommendationRecord> items = await _recommendationRepository.ListByRunAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            runId,
            cancellationToken);
        Persistence.Models.RunRecord? run =
            await _runRepository.GetByIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);
        return new AdvisoryRecommendationsListResult
        {
            Recommendations = items,
            ImproveLoopEvidenceJson = run?.ImproveLoopEvidenceJson,
        };
    }
}
