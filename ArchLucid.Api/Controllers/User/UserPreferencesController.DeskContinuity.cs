using ArchLucid.Contracts.User;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Controllers.User;

public sealed partial class UserPreferencesController
{
    private async Task<DeskContinuityDto> EnrichDeskContinuityFromReviewAsync(
        DeskContinuityDto continuity,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(continuity.LastOpenArchitectureId))
        {
            return continuity;
        }

        string? reviewId = continuity.LastOpenReviewId;

        if (string.IsNullOrWhiteSpace(reviewId) || !Guid.TryParse(reviewId.Trim(), out Guid runGuid))
        {
            return continuity;
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run?.ArchitectureId is null || run.ArchitectureId == Guid.Empty)
        {
            return continuity;
        }

        return DeskContinuityValues.ApplyReadBackfill(continuity, run.ArchitectureId.Value.ToString("D"));
    }
}
