using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis.ReplayComparison;

/// <inheritdoc cref="IReplayComparisonDiffSlice" />
public sealed class ReplayComparisonManifestsDiffSlice(IManifestDiffService manifestDiffService) : IReplayComparisonDiffSlice
{
    private readonly IManifestDiffService _manifestDiffService =
        manifestDiffService ?? throw new ArgumentNullException(nameof(manifestDiffService));

    public Task ApplyAsync(ReplayComparisonBuildContext context, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(context);

        ArchitectureRun leftRun = context.LeftDetail.Run;
        ArchitectureRun rightRun = context.RightDetail.Run;

        if (context.LeftDetail.Manifest is not null && context.RightDetail.Manifest is not null)
        {
            context.Report.ManifestDiff = _manifestDiffService.Compare(
                context.LeftDetail.Manifest,
                context.RightDetail.Manifest);
        }
        else if (!string.IsNullOrWhiteSpace(leftRun.CurrentManifestVersion)
                 || !string.IsNullOrWhiteSpace(rightRun.CurrentManifestVersion))
        {
            context.Report.Warnings.Add("One or both manifests were unavailable for manifest comparison.");
        }

        return Task.CompletedTask;
    }
}
