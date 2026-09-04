using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Sql;

using Dapper;

namespace ArchLucid.Persistence.Findings;

internal static partial class FindingRelationalWriter
{
    private static async Task InsertFindingRecordAsync(
        System.Data.IDbConnection connection,
        System.Data.IDbTransaction? transaction,
        Guid findingsSnapshotId,
        Guid findingRecordId,
        int sortOrder,
        Finding finding,
        FindingRelationalScope scope,
        CancellationToken ct)
    {
        object args = new
        {
            FindingRecordId = findingRecordId,
            FindingsSnapshotId = findingsSnapshotId,
            SortOrder = sortOrder,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            finding.FindingId,
            finding.FindingSchemaVersion,
            finding.FindingType,
            finding.Category,
            finding.QualityDimension,
            finding.EngineType,
            Severity = finding.Severity.ToString(),
            finding.Title,
            finding.Rationale,
            finding.PayloadType,
            PayloadJson = FindingPayloadJsonCodec.SerializePayload(finding.Payload),
            finding.RequestInputRef,
            finding.RunIdRef,
            AgentExecutionTraceId = finding.AgentExecutionTraceId ?? finding.Trace.SourceAgentExecutionTraceId,
            finding.ModelDeploymentName,
            finding.ModelVersion,
            finding.PromptTemplateId,
            finding.PromptTemplateVersion,
            finding.ConfidenceScore,
            finding.EvaluationConfidenceScore,
            EvaluationConfidenceLevel = finding.ConfidenceLevel is { } lvl ? lvl.ToString() : null,
            finding.PolicyRuleId,
            HumanReviewStatus = finding.HumanReviewStatus.ToString(),
            finding.ReviewedByUserId,
            finding.ReviewedAtUtc,
            finding.ReviewNotes,
            finding.IsMuted,
            finding.MuteReason,
            ReasoningTrace = finding.Trace.ReasoningTrace,
            ReasoningTraceDigestSha256 = finding.Trace.ReasoningTraceDigestSha256,
            finding.InsightDensityScore,
            Treatment = FindingInsightDensityColumnCodec.ToTreatmentStorage(finding.Treatment),
            Classification = FindingInsightDensityColumnCodec.ToClassificationStorage(finding.Classification),
            finding.WhyThisIsNotGeneric,
            finding.PrincipalArchitectValue,
            finding.DecisionConsequence
        };

        await connection.ExecuteAsync(
            new CommandDefinition(
                FindingsSnapshotWriteSql.InsertFindingRecord,
                args,
                transaction,
                cancellationToken: ct));
    }
}
