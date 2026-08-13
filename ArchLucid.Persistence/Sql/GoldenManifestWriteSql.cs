namespace ArchLucid.Persistence.Sql;

/// <summary>
///     Write SQL for <c>dbo.GoldenManifests</c> and its phase-1 relational slice tables (assumptions, warnings,
///     provenance reference lists, decisions and their evidence/node links).
/// </summary>
/// <remarks>
///     Every slice table carries the scope triple alongside <c>ManifestId</c> so tenant isolation survives a join-free
///     read of a single slice.
/// </remarks>
internal static class GoldenManifestWriteSql
{
    /// <summary>Dual-writes legacy JSON columns and the typed <c>ContractManifestVersion</c> column (DbUp 302).</summary>
    public const string Insert = """
                                 INSERT INTO dbo.GoldenManifests
                                 (
                                     TenantId, WorkspaceId, ProjectId,
                                     ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                     CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                     MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                     ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson,
                                     WarningsJson, ProvenanceJson, ManifestPayloadBlobUri, LifecycleStatus,
                                     ContractManifestVersion
                                 )
                                 VALUES
                                 (
                                     @TenantId, @WorkspaceId, @ProjectId,
                                     @ManifestId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @DecisionTraceId,
                                     @CreatedUtc, @ManifestHash, @RuleSetId, @RuleSetVersion, @RuleSetHash,
                                     @MetadataJson, @RequirementsJson, @TopologyJson, @SecurityJson, @ComplianceJson, @CostJson,
                                     @ConstraintsJson, @UnresolvedIssuesJson, @DecisionsJson, @AssumptionsJson,
                                     @WarningsJson, @ProvenanceJson, @ManifestPayloadBlobUri, @LifecycleStatus,
                                     @ContractManifestVersion
                                 );
                                 """;

    /// <summary>
    ///     Retires active manifests no run points at, returning the ids it changed. <c>OUTPUT deleted.ManifestId</c>
    ///     reports the pre-update rows, which is what the caller audits as "superseded".
    /// </summary>
    public const string SupersedeUnreferencedActive = """
                                                      UPDATE gm
                                                      SET LifecycleStatus = @SupersededStatus
                                                      OUTPUT deleted.ManifestId
                                                      FROM dbo.GoldenManifests AS gm
                                                      WHERE gm.TenantId = @TenantId
                                                        AND gm.WorkspaceId = @WorkspaceId
                                                        AND gm.ProjectId = @ProjectId
                                                        AND gm.LifecycleStatus = @ActiveStatus
                                                        AND gm.ArchivedUtc IS NULL
                                                        AND gm.ManifestId <> @NewManifestId
                                                        AND NOT EXISTS (
                                                            SELECT 1
                                                            FROM dbo.Runs AS r
                                                            WHERE r.GoldenManifestId = gm.ManifestId
                                                              AND r.TenantId = @TenantId
                                                              AND r.WorkspaceId = @WorkspaceId
                                                              AND r.ScopeProjectId = @ProjectId
                                                              AND r.ArchivedUtc IS NULL);
                                                      """;

    public const string InsertAssumption = """
                                           INSERT INTO dbo.GoldenManifestAssumptions (
                                               ManifestId, SortOrder, AssumptionText,
                                               TenantId, WorkspaceId, ProjectId)
                                           VALUES (
                                               @ManifestId, @SortOrder, @AssumptionText,
                                               @TenantId, @WorkspaceId, @ProjectId);
                                           """;

    public const string InsertWarning = """
                                        INSERT INTO dbo.GoldenManifestWarnings (
                                            ManifestId, SortOrder, WarningText,
                                            TenantId, WorkspaceId, ProjectId)
                                        VALUES (@ManifestId, @SortOrder, @WarningText, @TenantId, @WorkspaceId, @ProjectId);
                                        """;

    public const string InsertProvenanceSourceFinding = """
                                                        INSERT INTO dbo.GoldenManifestProvenanceSourceFindings (
                                                            ManifestId, SortOrder, FindingId,
                                                            TenantId, WorkspaceId, ProjectId)
                                                        VALUES (@ManifestId, @SortOrder, @FindingId, @TenantId, @WorkspaceId, @ProjectId);
                                                        """;

    public const string InsertProvenanceSourceGraphNode = """
                                                          INSERT INTO dbo.GoldenManifestProvenanceSourceGraphNodes (
                                                              ManifestId, SortOrder, NodeId,
                                                              TenantId, WorkspaceId, ProjectId)
                                                          VALUES (@ManifestId, @SortOrder, @NodeId, @TenantId, @WorkspaceId, @ProjectId);
                                                          """;

    public const string InsertProvenanceAppliedRule = """
                                                      INSERT INTO dbo.GoldenManifestProvenanceAppliedRules (
                                                          ManifestId, SortOrder, RuleId,
                                                          TenantId, WorkspaceId, ProjectId)
                                                      VALUES (@ManifestId, @SortOrder, @RuleId, @TenantId, @WorkspaceId, @ProjectId);
                                                      """;

    public const string InsertDecision = """
                                         INSERT INTO dbo.GoldenManifestDecisions
                                         (
                                             ManifestId, SortOrder, DecisionId, Category, Title, SelectedOption, Rationale, RawDecisionJson,
                                             Confidence, ConfidenceSource,
                                             TenantId, WorkspaceId, ProjectId
                                         )
                                         VALUES
                                         (
                                             @ManifestId, @SortOrder, @DecisionId, @Category, @Title, @SelectedOption, @Rationale, @RawDecisionJson,
                                             @Confidence, @ConfidenceSource,
                                             @TenantId, @WorkspaceId, @ProjectId
                                         );
                                         """;

    public const string InsertDecisionEvidenceLink = """
                                                     INSERT INTO dbo.GoldenManifestDecisionEvidenceLinks (
                                                         ManifestId, DecisionId, SortOrder, FindingId,
                                                         TenantId, WorkspaceId, ProjectId)
                                                     VALUES (@ManifestId, @DecisionId, @SortOrder, @FindingId, @TenantId, @WorkspaceId, @ProjectId);
                                                     """;

    public const string InsertDecisionNodeLink = """
                                                 INSERT INTO dbo.GoldenManifestDecisionNodeLinks (
                                                     ManifestId, DecisionId, SortOrder, NodeId,
                                                     TenantId, WorkspaceId, ProjectId)
                                                 VALUES (@ManifestId, @DecisionId, @SortOrder, @NodeId, @TenantId, @WorkspaceId, @ProjectId);
                                                 """;

    public const string CountAssumptions = "SELECT COUNT(1) FROM dbo.GoldenManifestAssumptions WHERE " + SliceScopeFilter;

    public const string CountWarnings = "SELECT COUNT(1) FROM dbo.GoldenManifestWarnings WHERE " + SliceScopeFilter;

    public const string CountProvenanceSourceFindings =
        "SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceFindings WHERE " + SliceScopeFilter;

    public const string CountProvenanceSourceGraphNodes =
        "SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceGraphNodes WHERE " + SliceScopeFilter;

    public const string CountProvenanceAppliedRules =
        "SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceAppliedRules WHERE " + SliceScopeFilter;

    public const string CountDecisions = "SELECT COUNT(1) FROM dbo.GoldenManifestDecisions WHERE " + SliceScopeFilter;

    /// <summary>Shared by every slice table; each one is keyed by manifest plus the scope triple.</summary>
    private const string SliceScopeFilter =
        "ManifestId = @ManifestId AND TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId";
}
