namespace ArchLucid.Persistence.Sql;

/// <summary>
///     First-paint findings coverage projection without shipping <c>PayloadJson</c> or full <c>FindingsJson</c> (TB-930).
/// </summary>
internal static class FindingsSnapshotCoverageSql
{
    /// <summary>
    ///     Snapshot header scalars + <c>JSON_QUERY</c> for engine failures only (not the full LOB to the app as a column).
    /// </summary>
    public const string SelectHeaderColumns = """
                                              FindingsSnapshotId, RunId, ContextSnapshotId, GraphSnapshotId, CreatedUtc,
                                              SchemaVersion, GenerationStatus,
                                              JSON_QUERY(FindingsJson, '$.engineFailures') AS EngineFailuresJson,
                                              TRY_CAST(JSON_VALUE(FindingsJson, '$.evaluationConfidenceEnrichmentSkipped') AS bit) AS EvaluationConfidenceEnrichmentSkipped
                                              """;

    /// <summary>Finding metadata for coverage engine counts — omit <c>PayloadJson</c> and child LOBs.</summary>
    public const string SelectFindingMetadataColumns = """
                                                       FindingId, FindingType, Category, EngineType, Severity, Title, PolicyRuleId, SortOrder
                                                       """;
}
