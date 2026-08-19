using ArchLucid.Core.CustomerSuccess;

namespace ArchLucid.Application.Operator;

public static class OperatorShellStickinessSnapshotMapper
{
    public static OperatorShellStickinessSnapshot Map(
        PilotFunnelSnapshot funnel,
        OperatorStickinessSignals signals)
    {
        ArgumentNullException.ThrowIfNull(funnel);
        ArgumentNullException.ThrowIfNull(signals);

        return new OperatorShellStickinessSnapshot
        {
            PilotFunnel = new OperatorShellPilotFunnelSnapshot
            {
                FirstRunCreatedUtc = ToOffset(funnel.FirstRunCreatedUtc),
                FirstGoldenManifestUtc = ToOffset(funnel.FirstGoldenManifestUtc),
                FirstComparisonUtc = ToOffset(funnel.FirstComparisonUtc),
                FirstArtifactOrBundleDownloadUtc = ToOffset(funnel.FirstArtifactOrBundleDownloadUtc),
                FirstReplayUtc = ToOffset(funnel.FirstReplayUtc),
                TotalRunsInScope = funnel.TotalRunsInScope,
                CommittedRunsInScope = funnel.CommittedRunsInScope,
                ProductLearningSignalsLast90Days = funnel.ProductLearningSignalsLast90Days,
            },
            LatestRunId = signals.LatestRunId,
            ComparisonEventsLast30Days = signals.ComparisonAuditEvents30D,
            PendingGovernanceApprovals = signals.PendingGovernanceApprovals,
        };
    }

    private static DateTimeOffset? ToOffset(DateTime? utc)
    {
        if (utc is null)
            return null;

        return new DateTimeOffset(DateTime.SpecifyKind(utc.Value, DateTimeKind.Utc), TimeSpan.Zero);
    }
}
