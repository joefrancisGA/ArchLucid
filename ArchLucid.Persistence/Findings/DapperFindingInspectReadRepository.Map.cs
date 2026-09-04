using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

public sealed partial class DapperFindingInspectReadRepository
{
    private static FindingInspectResponse MapInspectResponse(
        MainRow row,
        DispositionJoinResult joinResult,
        bool includeTypedPayload)
    {
        (string? ruleId, string? ruleName) = FindingInspectReadRepositoryCore.ResolveRuleFields(row.AppliedRuleIdsJson, joinResult.FirstRuleText);

        FindingHumanReviewStatus humanReview = FindingInspectReadModelMapper.ParseHumanReview(row.HumanReviewStatus);

        FindingConfidenceLevel? evaluationLevel =
            FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel(row.EvaluationConfidenceLevel);

        List<FindingInspectEvidenceItem> evidence = joinResult.RelatedNodes
            .Where(static n => !string.IsNullOrWhiteSpace(n))
            .Select(static n =>
                new FindingInspectEvidenceItem { ArtifactId = null, LineRange = null, Excerpt = n.Trim() })
            .ToList();

        JsonElement? typed = includeTypedPayload
            ? FindingInspectReadRepositoryCore.TryParsePayloadJson(row.PayloadJson)
            : FindingInspectReadRepositoryCore.BuildMetadataTypedPayload(row.Title, row.Rationale);
        FindingSeverity recordSeverity = FindingInspectReadModelMapper.ParseFindingSeverity(row.Severity);

        return new FindingInspectResponse
        {
            FindingId = row.FindingId,
            Severity = recordSeverity,
            TypedPayload = typed,
            DecisionRuleId = ruleId,
            DecisionRuleName = ruleName ?? ruleId,
            Evidence = evidence,
            RecommendedActions = joinResult.RecommendedActions,
            AuditRowId = joinResult.AuditRowId,
            RunId = row.RunId,
            ManifestVersion = row.CurrentManifestVersion,
            ModelDeploymentName = row.ModelDeploymentName,
            ModelAlias = row.ModelAlias,
            PromptTemplateVersion = row.PromptTemplateVersion,
            ConfidenceScore = row.ConfidenceScore,
            EvaluationConfidenceScore = row.EvaluationConfidenceScore,
            ConfidenceLevel = evaluationLevel,
            HumanReviewStatus = humanReview,
            IsMuted = row.IsMuted,
            MuteReason = row.MuteReason,
            ReasoningTrace = row.ReasoningTrace,
            ReasoningTraceDigestSha256 = row.ReasoningTraceDigestSha256,
            LatestDisposition = joinResult.DispositionRow is null
                ? null
                : FindingInspectReadModelMapper.ParseDisposition(joinResult.DispositionRow.Disposition),
            LatestDispositionOccurredAtUtc = joinResult.DispositionRow?.OccurredAtUtc,
            HasActiveWaiver = joinResult.ActiveWaiverCount > 0,
            AssignedToUserId = row.AssignedToUserId,
            RemediationDueUtc = row.RemediationDueUtc is null
                ? null
                : new DateTimeOffset(DateTime.SpecifyKind(row.RemediationDueUtc.Value, DateTimeKind.Utc)),
            RunStructuralExecutionMode = row.StructuralExecutionMode,
            RunRealModeFellBackToSimulator = row.RealModeFellBackToSimulator,
        };
    }

    private sealed class MainRow
    {
        public string FindingId
        {
            get;
            init;
        } = string.Empty;

        public string Severity
        {
            get;
            init;
        } = string.Empty;

        public string? PayloadJson
        {
            get;
            init;
        }

        public string? Title
        {
            get;
            init;
        }

        public string? Rationale
        {
            get;
            init;
        }

        public Guid RunId
        {
            get;
            init;
        }

        public string? CurrentManifestVersion
        {
            get;
            init;
        }

        public Guid? GoldenManifestId
        {
            get;
            init;
        }

        public StructuralExecutionMode StructuralExecutionMode
        {
            get;
            init;
        }

        public bool RealModeFellBackToSimulator
        {
            get;
            init;
        }

        public string? AppliedRuleIdsJson
        {
            get;
            init;
        }

        public string? ModelDeploymentName
        {
            get;
            init;
        }

        public string? ModelAlias
        {
            get;
            init;
        }

        public string? PromptTemplateVersion
        {
            get;
            init;
        }

        public double? ConfidenceScore
        {
            get;
            init;
        }

        public int? EvaluationConfidenceScore
        {
            get;
            init;
        }

        public string? EvaluationConfidenceLevel
        {
            get;
            init;
        }

        public string? HumanReviewStatus
        {
            get;
            init;
        }

        public bool IsMuted
        {
            get;
            init;
        }

        public string? MuteReason
        {
            get;
            init;
        }

        public string? AssignedToUserId
        {
            get;
            init;
        }

        public DateTime? RemediationDueUtc
        {
            get;
            init;
        }

        public string? ReasoningTrace
        {
            get;
            init;
        }

        public string? ReasoningTraceDigestSha256
        {
            get;
            init;
        }
    }

    private sealed class DispositionRow
    {
        public string? Disposition
        {
            get;
            init;
        }

        public DateTimeOffset? OccurredAtUtc
        {
            get;
            init;
        }
    }
}
