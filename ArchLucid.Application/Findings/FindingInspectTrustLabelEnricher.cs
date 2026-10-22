using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Applies authoritative trust labels to <see cref="FindingInspectResponse" /> read models.
/// </summary>
public static class FindingInspectTrustLabelEnricher
{
    public static FindingInspectResponse Enrich(FindingInspectResponse response, IFindingTrustLabelMapper mapper)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentNullException.ThrowIfNull(mapper);

        ArchitectureFinding finding = new()
        {
            PolicyRuleId = response.DecisionRuleId,
            EvidenceRefs = response.Evidence.Count > 0 ? [response.Evidence[0].Excerpt ?? "evidence"] : [],
            ConfidenceLevel = response.ConfidenceLevel,
            EvaluationConfidenceScore = response.EvaluationConfidenceScore ?? 0,
        };

        AgentTrustContext context = FindingInspectTrustContextResolver.Resolve(response);
        FindingTrustSummary summary = mapper.Map(finding, context);

        string? runModeLabel = response.RunStructuralExecutionMode is StructuralExecutionMode mode
            ? StructuralExecutionModeLabels.ToDisplayLabel(mode)
            : null;

        string? runModeDetail = response.RunStructuralExecutionMode is StructuralExecutionMode detailMode
            ? StructuralExecutionModeLabels.ToOperatorDetail(detailMode)
            : null;

        if (runModeLabel is not null
            && response.RunStructuralExecutionMode is StructuralExecutionMode persistedMode
            && !StructuralExecutionModeHonesty.DisplayLabelMatchesPersistedMode(persistedMode, runModeLabel))
        {
            throw new InvalidOperationException(
                "Run execution mode label would promote a non-Real mode to Real (TB-971).");
        }

        return new FindingInspectResponse
        {
            FindingId = response.FindingId,
            TypedPayload = response.TypedPayload,
            Severity = response.Severity,
            DecisionRuleId = response.DecisionRuleId,
            DecisionRuleName = response.DecisionRuleName,
            Evidence = response.Evidence,
            AuditRowId = response.AuditRowId,
            RunId = response.RunId,
            ManifestVersion = response.ManifestVersion,
            ModelDeploymentName = response.ModelDeploymentName,
            ModelAlias = response.ModelAlias,
            PromptTemplateVersion = response.PromptTemplateVersion,
            ConfidenceScore = response.ConfidenceScore,
            EvaluationConfidenceScore = response.EvaluationConfidenceScore,
            ConfidenceLevel = response.ConfidenceLevel,
            HumanReviewStatus = response.HumanReviewStatus,
            RecommendedActions = response.RecommendedActions,
            ReasoningSummary = response.ReasoningSummary,
            IsMuted = response.IsMuted,
            MuteReason = response.MuteReason,
            ReasoningTrace = response.ReasoningTrace,
            ReasoningTraceDigestSha256 = response.ReasoningTraceDigestSha256,
            LatestDisposition = response.LatestDisposition,
            LatestDispositionOccurredAtUtc = response.LatestDispositionOccurredAtUtc,
            HasActiveWaiver = response.HasActiveWaiver,
            RevisitDueUtc = response.RevisitDueUtc,
            AssignedToUserId = response.AssignedToUserId,
            RemediationDueUtc = response.RemediationDueUtc,
            Provider = response.Provider,
            ExternalKey = response.ExternalKey,
            ExternalUrl = response.ExternalUrl,
            ItsmLinkedTicketsSummary = response.ItsmLinkedTicketsSummary,
            TrackedExternally = response.TrackedExternally,
            ExternalTrackingSummary = response.ExternalTrackingSummary,
            TrustLabel = summary.Label.ToString(),
            TrustLabelReason = summary.ShortReason,
            RunStructuralExecutionMode = response.RunStructuralExecutionMode,
            RunRealModeFellBackToSimulator = response.RunRealModeFellBackToSimulator,
            RunExecutionModeDisplayLabel = runModeLabel,
            RunExecutionModeDetail = runModeDetail,
        };
    }
}
