namespace ArchLucid.Persistence.Sql;

/// <summary>
///     First-paint findings coverage projection without shipping <c>PayloadJson</c> or full <c>FindingsJson</c> (TB-930).
/// </summary>
internal static class FindingsSnapshotCoverageSql
{
    /// <summary>
    ///     Snapshot header scalars and projected engine metadata (not the full JSON LOB).
    /// </summary>
    public const string SelectHeaderColumns = """
                                              FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId, CreatedUtc,
                                              SchemaVersion, GenerationStatus,
                                              JSON_QUERY(FindingsJson, '$.engineFailures') AS EngineFailuresJson,
                                              JSON_VALUE(FindingsJson, '$.requirementComparisonRecovery') AS RequirementComparisonRecovery,
                                              TRY_CAST(JSON_VALUE(FindingsJson, '$.evaluationConfidenceEnrichmentSkipped') AS bit) AS EvaluationConfidenceEnrichmentSkipped
                                              """;

    /// <summary>Finding metadata for coverage engine counts — omit <c>PayloadJson</c> and child LOBs.</summary>
    public const string SelectFindingMetadataColumns = """
                                                       FindingId, FindingType, Category, EngineType, Severity, Title, PolicyRuleId, SortOrder, IsMuted
                                                       """;
}
