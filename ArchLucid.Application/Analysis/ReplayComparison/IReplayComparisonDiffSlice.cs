namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <summary>
///     Applies one facet of an end-to-end replay comparison to a shared report.
/// </summary>
public interface IReplayComparisonDiffSlice
{
    Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default);
}
