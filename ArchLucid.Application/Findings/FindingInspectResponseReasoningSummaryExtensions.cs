using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Attaches <see cref="FindingInspectResponse.ReasoningSummary" /> without mutating persistence read-models.</summary>
public static class FindingInspectResponseReasoningSummaryExtensions
{
    /// <summary>Copies <paramref name="source" /> and sets <see cref="FindingInspectResponse.ReasoningSummary" /> from the builder.</summary>
    public static FindingInspectResponse WithReasoningSummaryFromBuilder(
        this FindingInspectResponse source,
        IReasoningSummaryBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(builder);

        string? reasoningSummary = builder.TryBuild(source);

        return new FindingInspectResponse
        {
            FindingId = source.FindingId,
            TypedPayload = source.TypedPayload,
            Severity = source.Severity,
            DecisionRuleId = source.DecisionRuleId,
            DecisionRuleName = source.DecisionRuleName,
            Evidence = source.Evidence,
            AuditRowId = source.AuditRowId,
            RunId = source.RunId,
            ManifestVersion = source.ManifestVersion,
            ModelDeploymentName = source.ModelDeploymentName,
            ModelAlias = source.ModelAlias,
            PromptTemplateVersion = source.PromptTemplateVersion,
            ConfidenceScore = source.ConfidenceScore,
            EvaluationConfidenceScore = source.EvaluationConfidenceScore,
            ConfidenceLevel = source.ConfidenceLevel,
            HumanReviewStatus = source.HumanReviewStatus,
            RecommendedActions = source.RecommendedActions,
            ReasoningSummary = reasoningSummary,
            IsMuted = source.IsMuted,
            MuteReason = source.MuteReason,
            ReasoningTrace = source.ReasoningTrace,
            ReasoningTraceDigestSha256 = source.ReasoningTraceDigestSha256,
            LatestDisposition = source.LatestDisposition,
            LatestDispositionOccurredAtUtc = source.LatestDispositionOccurredAtUtc,
            HasActiveWaiver = source.HasActiveWaiver,
            RevisitDueUtc = source.RevisitDueUtc,
            AssignedToUserId = source.AssignedToUserId,
            RemediationDueUtc = source.RemediationDueUtc,
            Provider = source.Provider,
            ExternalKey = source.ExternalKey,
            ExternalUrl = source.ExternalUrl,
            ItsmLinkedTicketsSummary = source.ItsmLinkedTicketsSummary,
            TrackedExternally = source.TrackedExternally,
            ExternalTrackingSummary = source.ExternalTrackingSummary,
            TrustLabel = source.TrustLabel,
            TrustLabelReason = source.TrustLabelReason,
        };
    }
}
