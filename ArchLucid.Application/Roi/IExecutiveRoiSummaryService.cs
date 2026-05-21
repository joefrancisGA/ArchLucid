using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Roi;

/// <summary>
///     Builds the cross-run executive ROI summary for the current tenant scope.
/// </summary>
public interface IExecutiveRoiSummaryService
{
    Task<ExecutiveRoiSummaryResponse> BuildAsync(CancellationToken cancellationToken = default);
}
