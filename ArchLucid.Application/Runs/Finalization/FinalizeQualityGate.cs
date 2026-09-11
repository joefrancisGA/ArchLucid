using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Finalization;

/// <inheritdoc cref="IFinalizeQualityGate" />
public sealed class FinalizeQualityGate(
    IOptions<FinalizeQualityGateOptions> options,
    IFindingReviewTrailRepository findingReviewTrailRepository) : IFinalizeQualityGate
{
    public const string BlockedPrefix = "Finalize blocked by quality scorecard. ";

    private readonly IOptions<FinalizeQualityGateOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    /// <inheritdoc />
    public async Task EnsurePassOrThrowAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        FindingsSnapshot findings,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(findings);

        FinalizeQualityGateOptions gateOptions = _options.Value ?? new FinalizeQualityGateOptions();

        if (!gateOptions.Enabled)
            return;

        IReadOnlyDictionary<string, FindingDisposition> latestDispositions =
            await PreFinalizeLatestDispositionLoader
                .LoadAsync(_findingReviewTrailRepository, scope, findings.Findings, cancellationToken)
                .ConfigureAwait(false);

        FinalizeQualityScorecardCounts counts =
            FinalizeQualityScorecardEvaluator.Compute(request, findings, latestDispositions, gateOptions);

        IReadOnlyList<string> reasons = FinalizeQualityScorecardEvaluator.GetBlockingReasons(counts, gateOptions);

        if (reasons.Count > 0)
            throw new ConflictException(BlockedPrefix + string.Join(" ", reasons));
    }
}
