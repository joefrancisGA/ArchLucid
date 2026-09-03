using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

internal static class FindingInspectReadRepositoryCore
{
    public static (string? RuleId, string? RuleName) ResolveRuleFields(string? appliedRuleIdsJson, string? firstRuleText)
    {
        if (string.IsNullOrWhiteSpace(appliedRuleIdsJson))
            return !string.IsNullOrWhiteSpace(firstRuleText) ? (firstRuleText.Trim(), firstRuleText.Trim()) : (null, null);

        try
        {
            List<string>? ids = JsonSerializer.Deserialize<List<string>>(appliedRuleIdsJson);

            if (ids is { Count: > 0 })
            {
                string? firstRaw = ids[0];

                if (!string.IsNullOrWhiteSpace(firstRaw))
                {
                    string first = firstRaw.Trim();

                    return (first, first);
                }
            }
        }
        catch (JsonException)
        {
            // Fall through to trace text only.
        }

        return !string.IsNullOrWhiteSpace(firstRuleText) ? (firstRuleText.Trim(), firstRuleText.Trim()) : (null, null);
    }

    public static JsonElement? BuildMetadataTypedPayload(string? title, string? rationale)
    {
        if (string.IsNullOrWhiteSpace(title) && string.IsNullOrWhiteSpace(rationale))
            return null;

        Dictionary<string, string?> slim = new(StringComparer.Ordinal)
        {
            ["title"] = string.IsNullOrWhiteSpace(title) ? null : title.Trim(),
            ["rationale"] = string.IsNullOrWhiteSpace(rationale) ? null : rationale.Trim(),
            ["whyThisMatters"] = string.IsNullOrWhiteSpace(rationale) ? null : rationale.Trim(),
        };

        return JsonSerializer.SerializeToElement(slim);
    }

    public static JsonElement? TryParsePayloadJson(string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<JsonElement>(payloadJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    public static FindingInspectResponse BuildInspectResponse(
        string findingId,
        FindingSeverity severity,
        JsonElement? typedPayload,
        string? ruleId,
        string? ruleName,
        IReadOnlyList<FindingInspectEvidenceItem> evidence,
        IReadOnlyList<string> recommendedActions,
        Guid? auditRowId,
        Guid runId,
        string? manifestVersion,
        string? modelDeploymentName,
        string? modelAlias,
        string? promptTemplateVersion,
        double? confidenceScore,
        int? evaluationConfidenceScore,
        FindingConfidenceLevel? confidenceLevel,
        FindingHumanReviewStatus humanReviewStatus,
        bool isMuted,
        string? muteReason,
        string? reasoningTrace,
        string? reasoningTraceDigestSha256,
        FindingDisposition? latestDisposition,
        DateTimeOffset? latestDispositionOccurredAtUtc,
        bool hasActiveWaiver,
        string? assignedToUserId,
        DateTimeOffset? remediationDueUtc,
        StructuralExecutionMode runStructuralExecutionMode,
        bool runRealModeFellBackToSimulator)
    {
        return new FindingInspectResponse
        {
            FindingId = findingId,
            Severity = severity,
            TypedPayload = typedPayload,
            DecisionRuleId = ruleId,
            DecisionRuleName = ruleName ?? ruleId,
            Evidence = evidence,
            RecommendedActions = recommendedActions,
            AuditRowId = auditRowId,
            RunId = runId,
            ManifestVersion = manifestVersion,
            ModelDeploymentName = modelDeploymentName,
            ModelAlias = modelAlias,
            PromptTemplateVersion = promptTemplateVersion,
            ConfidenceScore = confidenceScore,
            EvaluationConfidenceScore = evaluationConfidenceScore,
            ConfidenceLevel = confidenceLevel,
            HumanReviewStatus = humanReviewStatus,
            IsMuted = isMuted,
            MuteReason = muteReason,
            ReasoningTrace = reasoningTrace,
            ReasoningTraceDigestSha256 = reasoningTraceDigestSha256,
            LatestDisposition = latestDisposition,
            LatestDispositionOccurredAtUtc = latestDispositionOccurredAtUtc,
            HasActiveWaiver = hasActiveWaiver,
            AssignedToUserId = assignedToUserId,
            RemediationDueUtc = remediationDueUtc,
            RunStructuralExecutionMode = runStructuralExecutionMode,
            RunRealModeFellBackToSimulator = runRealModeFellBackToSimulator,
        };
    }
}
