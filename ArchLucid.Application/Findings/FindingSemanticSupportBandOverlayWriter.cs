using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>AS-060: persist semantic support band overlays without mutating sealed finding prose.</summary>
public sealed class FindingSemanticSupportBandOverlayWriter(
    IFindingSemanticSupportBandOverlayRepository overlayRepository)
{
    private readonly IFindingSemanticSupportBandOverlayRepository _overlayRepository =
        overlayRepository ?? throw new ArgumentNullException(nameof(overlayRepository));

    public Task PersistSnapshotOverlaysAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        IReadOnlyList<Finding> findings,
        CancellationToken cancellationToken = default) =>
        PersistSnapshotOverlaysCoreAsync(
            findingsSnapshotId,
            scope,
            findings,
            FindingSemanticSupportBandScorerVersions.As057QuoteOverlapV1,
            cancellationToken);

    /// <summary>
    ///     Persist already-assigned bands (ADR 0099 LLM finalize) without re-running the heuristic scorer version stamp.
    /// </summary>
    public Task PersistAssignedOverlaysAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        IReadOnlyList<Finding> findings,
        string scorerVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(scorerVersion);

        return PersistSnapshotOverlaysCoreAsync(
            findingsSnapshotId,
            scope,
            findings,
            scorerVersion.Trim(),
            cancellationToken);
    }

    private async Task PersistSnapshotOverlaysCoreAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        IReadOnlyList<Finding> findings,
        string scorerVersion,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(findings);

        if (findings.Count == 0)
            return;

        DateTime scoredAtUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        foreach (Finding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingId))
                continue;

            FindingSemanticSupportBandOverlayScoreResult score =
                FindingSemanticSupportBandOverlayScoring.ScoreFinding(finding, scorerVersion);

            FindingSemanticSupportBandOverlayRecord overlay = new()
            {
                FindingId = finding.FindingId.Trim(),
                Band = score.Band,
                ScorerVersion = score.ScorerVersion,
                EvidenceExcerptHashSha256 = score.EvidenceExcerptHashSha256,
                ScoredAtUtc = scoredAtUtc,
            };

            await _overlayRepository.UpsertAsync(findingsSnapshotId, scope, overlay, cancellationToken)
                .ConfigureAwait(false);

            finding.SemanticSupportBand = score.Band;
        }
    }

    public Task FreezeSnapshotOverlaysAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default) =>
        _overlayRepository.FreezeSnapshotAsync(findingsSnapshotId, scope, cancellationToken);
}
