using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;

namespace ArchLucid.Persistence.Findings;

/// <summary>SQL builders for findings snapshot relational reads.</summary>
internal static class FindingsSnapshotSqlBuilder
{
    /// <summary>
    ///     Builds the FindingRecords SELECT used by relational snapshot load.
    ///     Internal for unit coverage of the SELECT/FROM join — a missing separator once produced
    ///     <c>...Sha256FROM dbo...</c> (SqlError 102) and failed Live E2E demo preview.
    /// </summary>
    internal static string BuildFindingRecordsSelectSql(ScopeContext scope, bool includeInsightDensityColumns)
    {
        // Keep column lists as raw strings so SQL Server schema evolution stays reviewable in diffs.
        // C# raw string literals drop the newline before the closing delimiter, so concatenating
        // another raw string that starts with FROM would glue the last column to FROM
        // (...Sha256FROM dbo.FindingRecords) unless we insert an explicit separator.
        string baseColumns = """
                             SELECT
                                 FindingRecordId, SortOrder, FindingId, FindingSchemaVersion, FindingType, Category, QualityDimension, EngineType,
                                 Severity, Title, Rationale, PayloadType, PayloadJson,
                                 RequestInputRef, RunIdRef, AgentExecutionTraceId,
                                 ModelDeploymentName, ModelVersion, PromptTemplateId, PromptTemplateVersion,
                                 ConfidenceScore, EvaluationConfidenceScore, EvaluationConfidenceLevel, PolicyRuleId,
                                 HumanReviewStatus, ReviewedByUserId, ReviewedAtUtc, ReviewNotes,
                                 IsMuted, MuteReason, ReasoningTrace, ReasoningTraceDigestSha256
                             """;

        string insightDensityColumns = includeInsightDensityColumns
            ? """
              ,
                                  InsightDensityScore, Treatment, Classification,
                                  WhyThisIsNotGeneric, PrincipalArchitectValue, DecisionConsequence
              """
            : string.Empty;

        // Explicit \n — do not rely on blank lines inside raw strings (easy to lose in edits).
        return baseColumns
               + insightDensityColumns
               + "\nFROM dbo.FindingRecords\nWHERE FindingsSnapshotId = @FindingsSnapshotId"
               + PersistenceTenantScope.AndTripleWhere(scope)
               + " ORDER BY SortOrder;";
    }
}
