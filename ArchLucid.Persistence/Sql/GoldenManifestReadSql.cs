namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Read SQL for <c>dbo.GoldenManifests</c> lookups that hydrate a <c>ManifestDocument</c>.
/// </summary>
internal static class GoldenManifestReadSql
{
    public const string SelectById = """
                                     SELECT
                                         TenantId, WorkspaceId, ProjectId,
                                         ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                         CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                         MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                         ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                                         WarningsJson, ProvenanceJson, HasherBoundJson, ManifestPayloadBlobUri
                                     FROM dbo.GoldenManifests
                                     WHERE TenantId = @TenantId
                                       AND WorkspaceId = @WorkspaceId
                                       AND ProjectId = @ProjectId
                                       AND ManifestId = @ManifestId;
                                     """;

    /// <summary>
    ///     Contract manifest versions are not unique per scope, so the newest row wins rather than failing the read.
    /// </summary>
    public const string SelectLatestByContractManifestVersion = """
                                                                SELECT TOP (1)
                                                                    TenantId, WorkspaceId, ProjectId,
                                                                    ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                                                    CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                                                    MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                                                    ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                                                                    WarningsJson, ProvenanceJson, HasherBoundJson, ManifestPayloadBlobUri, ContractManifestVersion
                                                                FROM dbo.GoldenManifests
                                                                WHERE TenantId = @TenantId
                                                                  AND WorkspaceId = @WorkspaceId
                                                                  AND ProjectId = @ProjectId
                                                                  AND ContractManifestVersion COLLATE Latin1_General_CI_AI = @ManifestVersion
                                                                ORDER BY CreatedUtc DESC;
                                                                """;

    /// <summary>
    ///     Slim LOB projection: prior-retrieval indexing only needs Decisions + Topology (+ Metadata), so the remaining
    ///     JSON columns are left unread. The blob overlay still applies when <c>ManifestPayloadBlobUri</c> is set, and the
    ///     relational slice counts are skipped for this path.
    /// </summary>
    public const string SelectPriorCommittedForRetrieval = """
                                                           SELECT TOP (@MaxManifests)
                                                               TenantId, WorkspaceId, ProjectId,
                                                               ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                                               CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                                               MetadataJson, TopologyJson, DecisionsJson, ManifestPayloadBlobUri, ContractManifestVersion
                                                           FROM dbo.GoldenManifests WITH (NOLOCK)
                                                           WHERE TenantId = @TenantId
                                                             AND WorkspaceId = @WorkspaceId
                                                             AND ProjectId = @ProjectId
                                                             AND RunId <> @ExcludeRunId
                                                             AND (ArchivedUtc IS NULL)
                                                           ORDER BY CreatedUtc DESC;
                                                           """;
}
