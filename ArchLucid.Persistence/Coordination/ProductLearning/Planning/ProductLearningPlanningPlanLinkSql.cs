namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

/// <summary>
///     Named Dapper statements for the <c>dbo.ProductLearningImprovementPlan*</c> link tables. Kept out of method
///     bodies so the tenant-scope joins can be reviewed side by side instead of one method at a time.
/// </summary>
/// <remarks>
///     Every read joins back to <c>dbo.ProductLearningImprovementPlans</c> and filters on the plan's tenant, workspace,
///     and project, because the link tables are reachable by <c>PlanId</c> alone.
/// </remarks>
internal static class ProductLearningPlanningPlanLinkSql
{
    public const string InsertArchitectureRunLink = """
                                                    INSERT INTO dbo.ProductLearningImprovementPlanArchitectureRuns (
                                                        PlanId, ArchitectureRunId, TenantId, WorkspaceId, ProjectId)
                                                    VALUES (@PlanId, @ArchitectureRunId, @TenantId, @WorkspaceId, @ProjectId);
                                                    """;

    public const string InsertSignalLink = """
                                           INSERT INTO dbo.ProductLearningImprovementPlanSignalLinks (
                                               PlanId, SignalId, TriageStatusSnapshot, TenantId, WorkspaceId, ProjectId)
                                           VALUES (@PlanId, @SignalId, @TriageStatusSnapshot, @TenantId, @WorkspaceId, @ProjectId);
                                           """;

    public const string InsertArtifactLink = """
                                             INSERT INTO dbo.ProductLearningImprovementPlanArtifactLinks
                                             (
                                                 LinkId,
                                                 PlanId,
                                                 AuthorityBundleId,
                                                 AuthorityArtifactSortOrder,
                                                 PilotArtifactHint,
                                                 TenantId,
                                                 WorkspaceId,
                                                 ProjectId
                                             )
                                             VALUES
                                             (
                                                 @LinkId,
                                                 @PlanId,
                                                 @AuthorityBundleId,
                                                 @AuthorityArtifactSortOrder,
                                                 @PilotArtifactHint,
                                                 @TenantId,
                                                 @WorkspaceId,
                                                 @ProjectId
                                             );
                                             """;

    public const string SelectPlanArchitectureRunIds = """
                                                       SELECT r.ArchitectureRunId
                                                       FROM dbo.ProductLearningImprovementPlanArchitectureRuns r
                                                       INNER JOIN dbo.ProductLearningImprovementPlans p ON p.PlanId = r.PlanId
                                                       WHERE r.PlanId = @PlanId
                                                         AND p.TenantId = @TenantId
                                                         AND p.WorkspaceId = @WorkspaceId
                                                         AND p.ProjectId = @ProjectId
                                                       ORDER BY r.ArchitectureRunId ASC;
                                                       """;

    public const string SelectPlanSignalLinks = """
                                                SELECT s.PlanId, s.SignalId, s.TriageStatusSnapshot
                                                FROM dbo.ProductLearningImprovementPlanSignalLinks s
                                                INNER JOIN dbo.ProductLearningImprovementPlans p ON p.PlanId = s.PlanId
                                                WHERE s.PlanId = @PlanId
                                                  AND p.TenantId = @TenantId
                                                  AND p.WorkspaceId = @WorkspaceId
                                                  AND p.ProjectId = @ProjectId
                                                ORDER BY s.SignalId ASC;
                                                """;

    public const string SelectPlanArtifactLinks = """
                                                  SELECT a.LinkId, a.PlanId, a.AuthorityBundleId, a.AuthorityArtifactSortOrder, a.PilotArtifactHint
                                                  FROM dbo.ProductLearningImprovementPlanArtifactLinks a
                                                  INNER JOIN dbo.ProductLearningImprovementPlans p ON p.PlanId = a.PlanId
                                                  WHERE a.PlanId = @PlanId
                                                    AND p.TenantId = @TenantId
                                                    AND p.WorkspaceId = @WorkspaceId
                                                    AND p.ProjectId = @ProjectId
                                                  ORDER BY a.LinkId ASC;
                                                  """;

    /// <summary>Resolves the owning plan's scope so link writes inherit it instead of trusting caller-supplied ids.</summary>
    public const string SelectPlanScope = """
                                          SELECT TenantId, WorkspaceId, ProjectId
                                          FROM dbo.ProductLearningImprovementPlans
                                          WHERE PlanId = @PlanId;
                                          """;

    public const string ArchitectureRunExists = """
                                                SELECT CASE WHEN EXISTS(SELECT 1 FROM dbo.Runs WHERE RunId = @RunId) THEN 1 ELSE 0 END;
                                                """;

    public const string PilotSignalExistsInScope = """
                                                   SELECT CASE WHEN EXISTS(
                                                       SELECT 1 FROM dbo.ProductLearningPilotSignals
                                                       WHERE SignalId = @SignalId
                                                         AND TenantId = @TenantId
                                                         AND WorkspaceId = @WorkspaceId
                                                         AND ProjectId = @ProjectId) THEN 1 ELSE 0 END;
                                                   """;

    /// <summary>
    ///     Artifact-bundle tables are optional in some deployments, so artifact link validation probes for the table
    ///     first and skips the coordinate check when it is absent rather than failing the write.
    /// </summary>
    public const string ArtifactBundleArtifactsTableExists = """
                                                             SELECT CASE WHEN OBJECT_ID(N'dbo.ArtifactBundleArtifacts', N'U') IS NULL THEN 0 ELSE 1 END;
                                                             """;

    public const string AuthorityArtifactExistsInScope = """
                                                         SELECT CASE WHEN EXISTS(
                                                             SELECT 1
                                                             FROM dbo.ArtifactBundleArtifacts aba
                                                             INNER JOIN dbo.ArtifactBundles b ON b.BundleId = aba.BundleId
                                                             WHERE aba.BundleId = @BundleId
                                                               AND aba.SortOrder = @SortOrder
                                                               AND b.TenantId = @TenantId
                                                               AND b.WorkspaceId = @WorkspaceId
                                                               AND b.ProjectId = @ProjectId) THEN 1 ELSE 0 END;
                                                         """;
}
