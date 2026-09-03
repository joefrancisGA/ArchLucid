namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <summary>
///     Assembles an <see cref="EndToEndReplayComparisonReport"/> by applying registered diff slices.
/// </summary>
public sealed class EndToEndReplayComparisonReportComposer(IEnumerable<IReplayComparisonDiffSlice> slices)
{
    private readonly IReadOnlyList<IReplayComparisonDiffSlice> _slices =
        (slices ?? throw new ArgumentNullException(nameof(slices))).ToList();

    public async Task ComposeAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        foreach (IReplayComparisonDiffSlice slice in _slices)
        {
            await slice.ApplyAsync(context, cancellationToken).ConfigureAwait(false);
        }
    }
}
