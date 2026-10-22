using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>Attaches TB-386 ITSM linkage fields without mutating persistence read-models.</summary>
public static class FindingInspectResponseExternalTrackingExtensions
{
    public static FindingInspectResponse WithExternalTracking(
        this FindingInspectResponse source,
        RunFindingExternalTrackingProjection? tracking)
    {
        ArgumentNullException.ThrowIfNull(source);

        if (tracking is null)
            return source;

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
            ReasoningSummary = source.ReasoningSummary,
            IsMuted = source.IsMuted,
            MuteReason = source.MuteReason,
            ReasoningTrace = source.ReasoningTrace,
            ReasoningTraceDigestSha256 = source.ReasoningTraceDigestSha256,
            LatestDisposition = source.LatestDisposition,
            LatestDispositionOccurredAtUtc = source.LatestDispositionOccurredAtUtc,
            HasActiveWaiver = source.HasActiveWaiver,
            RevisitDueUtc = tracking.RevisitDueUtc ?? source.RevisitDueUtc,
            Provider = tracking.Provider,
            ExternalKey = tracking.ExternalKey,
            ExternalUrl = tracking.ExternalUrl,
            ItsmLinkedTicketsSummary = tracking.ItsmLinkedTicketsSummary,
            TrackedExternally = tracking.TrackedExternally,
            ExternalTrackingSummary = tracking.ExternalTrackingSummary,
            TrustLabel = source.TrustLabel,
            TrustLabelReason = source.TrustLabelReason,
        };
    }
}
