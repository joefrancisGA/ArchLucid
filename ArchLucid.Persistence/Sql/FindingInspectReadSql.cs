namespace ArchLucid.Persistence.Sql;

/// <summary>
///     SQL text for <see cref="Findings.DapperFindingInspectReadRepository" /> reads.
///     Kept as constants so unit tests can assert tenant/workspace/project predicates without a database.
/// </summary>
internal static class FindingInspectReadSql
{
    /// <summary>Primary inspect row including <c>PayloadJson</c>.</summary>
    public const string MainInspectWithTypedPayload = """
                                                     SELECT TOP 1
                                                         fr.FindingId,
                                                         fr.Severity,
                                                         fr.PayloadJson,
                                                         fr.Title,
                                                         fr.Rationale,
                                                         fr.ModelDeploymentName,
                                                         JSON_VALUE(aet.TraceJson, '$.modelAlias') AS ModelAlias,
                                                         fr.PromptTemplateVersion,
                                                         fr.ConfidenceScore,
                                                         fr.EvaluationConfidenceScore,
                                                         fr.EvaluationConfidenceLevel,
                                                         fr.HumanReviewStatus,
                                                         fr.IsMuted,
                                                         fr.MuteReason,
                                                         fr.AssignedToUserId,
                                                         fr.RemediationDueUtc,
                                                         fr.ReasoningTrace,
                                                         fr.ReasoningTraceDigestSha256,
                                                         r.RunId,
                                                         r.CurrentManifestVersion,
                                                         r.GoldenManifestId,
                                                         r.StructuralExecutionMode,
                                                         r.RealModeFellBackToSimulator,
                                                         dt.AppliedRuleIdsJson
                                                     FROM dbo.FindingRecords fr
                                                     INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                                                     INNER JOIN dbo.Runs r ON r.RunId = fs.RunId
                                                     LEFT JOIN dbo.AgentExecutionTraces aet ON aet.TraceId = fr.AgentExecutionTraceId
                                                     LEFT JOIN dbo.DecisioningTraces dt
                                                         ON dt.DecisionTraceId = r.DecisionTraceId
                                                        AND dt.TenantId = r.TenantId
                                                        AND dt.WorkspaceId = r.WorkspaceId
                                                        AND dt.ProjectId = r.ScopeProjectId
                                                     WHERE fr.FindingId = @FindingId
                                                       AND fr.TenantId = @TenantId
                                                       AND fr.WorkspaceId = @WorkspaceId
                                                       AND fr.ProjectId = @ScopeProjectId
                                                       AND r.TenantId = @TenantId
                                                       AND r.WorkspaceId = @WorkspaceId
                                                       AND r.ScopeProjectId = @ScopeProjectId
                                                       AND (r.ArchivedUtc IS NULL);
                                                     """;

    /// <summary>Primary inspect row with payload omitted (metadata-only typed payload built in-process).</summary>
    public const string MainInspectWithoutTypedPayload = """
                                                        SELECT TOP 1
                                                            fr.FindingId,
                                                            fr.Severity,
                                                            CAST(NULL AS nvarchar(max)) AS PayloadJson,
                                                            fr.Title,
                                                            fr.Rationale,
                                                            fr.ModelDeploymentName,
                                                            JSON_VALUE(aet.TraceJson, '$.modelAlias') AS ModelAlias,
                                                            fr.PromptTemplateVersion,
                                                            fr.ConfidenceScore,
                                                            fr.EvaluationConfidenceScore,
                                                            fr.EvaluationConfidenceLevel,
                                                            fr.HumanReviewStatus,
                                                            fr.IsMuted,
                                                            fr.MuteReason,
                                                            fr.AssignedToUserId,
                                                            fr.RemediationDueUtc,
                                                            fr.ReasoningTrace,
                                                            fr.ReasoningTraceDigestSha256,
                                                            r.RunId,
                                                            r.CurrentManifestVersion,
                                                            r.GoldenManifestId,
                                                            r.StructuralExecutionMode,
                                                            r.RealModeFellBackToSimulator,
                                                            dt.AppliedRuleIdsJson
                                                        FROM dbo.FindingRecords fr
                                                        INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                                                        INNER JOIN dbo.Runs r ON r.RunId = fs.RunId
                                                        LEFT JOIN dbo.AgentExecutionTraces aet ON aet.TraceId = fr.AgentExecutionTraceId
                                                        LEFT JOIN dbo.DecisioningTraces dt
                                                            ON dt.DecisionTraceId = r.DecisionTraceId
                                                           AND dt.TenantId = r.TenantId
                                                           AND dt.WorkspaceId = r.WorkspaceId
                                                           AND dt.ProjectId = r.ScopeProjectId
                                                        WHERE fr.FindingId = @FindingId
                                                          AND fr.TenantId = @TenantId
                                                          AND fr.WorkspaceId = @WorkspaceId
                                                          AND fr.ProjectId = @ScopeProjectId
                                                          AND r.TenantId = @TenantId
                                                          AND r.WorkspaceId = @WorkspaceId
                                                          AND r.ScopeProjectId = @ScopeProjectId
                                                          AND (r.ArchivedUtc IS NULL);
                                                        """;

    /// <summary>
    ///     Related nodes, rule text, recommended actions, audit row, latest disposition, and active waiver count.
    ///     FindingRecords and child rows filter tenant/workspace/project because FindingId is not unique within a tenant,
    ///     and run-only predicates can still surface a FindingRecords row when <c>fr.TenantId</c> diverges from the run.
    /// </summary>
    public const string FollowUpBatch = """
                                       SELECT frn.NodeId
                                       FROM dbo.FindingRelatedNodes frn
                                       INNER JOIN dbo.FindingRecords fr ON fr.FindingRecordId = frn.FindingRecordId
                                       INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                                       INNER JOIN dbo.Runs r ON r.RunId = fs.RunId
                                       WHERE fr.FindingId = @FindingId
                                         AND fr.TenantId = @TenantId
                                         AND fr.WorkspaceId = @WorkspaceId
                                         AND fr.ProjectId = @ScopeProjectId
                                         AND frn.TenantId = @TenantId
                                         AND frn.WorkspaceId = @WorkspaceId
                                         AND frn.ProjectId = @ScopeProjectId
                                         AND r.TenantId = @TenantId
                                         AND r.WorkspaceId = @WorkspaceId
                                         AND r.ScopeProjectId = @ScopeProjectId
                                       ORDER BY frn.SortOrder;

                                       SELECT TOP 1 tra.RuleText
                                       FROM dbo.FindingTraceRulesApplied tra
                                       INNER JOIN dbo.FindingRecords fr ON fr.FindingRecordId = tra.FindingRecordId
                                       INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                                       INNER JOIN dbo.Runs r ON r.RunId = fs.RunId
                                       WHERE fr.FindingId = @FindingId
                                         AND fr.TenantId = @TenantId
                                         AND fr.WorkspaceId = @WorkspaceId
                                         AND fr.ProjectId = @ScopeProjectId
                                         AND tra.TenantId = @TenantId
                                         AND tra.WorkspaceId = @WorkspaceId
                                         AND tra.ProjectId = @ScopeProjectId
                                         AND r.TenantId = @TenantId
                                         AND r.WorkspaceId = @WorkspaceId
                                         AND r.ScopeProjectId = @ScopeProjectId
                                       ORDER BY tra.SortOrder;

                                       SELECT fra.ActionText
                                       FROM dbo.FindingRecommendedActions fra
                                       INNER JOIN dbo.FindingRecords fr ON fr.FindingRecordId = fra.FindingRecordId
                                       INNER JOIN dbo.FindingsSnapshots fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                                       INNER JOIN dbo.Runs r ON r.RunId = fs.RunId
                                       WHERE fr.FindingId = @FindingId
                                         AND fr.TenantId = @TenantId
                                         AND fr.WorkspaceId = @WorkspaceId
                                         AND fr.ProjectId = @ScopeProjectId
                                         AND fra.TenantId = @TenantId
                                         AND fra.WorkspaceId = @WorkspaceId
                                         AND fra.ProjectId = @ScopeProjectId
                                         AND r.TenantId = @TenantId
                                         AND r.WorkspaceId = @WorkspaceId
                                         AND r.ScopeProjectId = @ScopeProjectId
                                       ORDER BY fra.SortOrder;

                                       SELECT TOP 1 ae.EventId
                                       FROM dbo.AuditEvents ae
                                       WHERE ae.RunId = @RunId
                                         AND ae.TenantId = @TenantId
                                         AND ae.WorkspaceId = @WorkspaceId
                                         AND ae.ProjectId = @ScopeProjectId
                                         AND ae.EventType = @EventType
                                       ORDER BY ae.OccurredUtc DESC, ae.EventId DESC;

                                       SELECT TOP 1 Disposition, OccurredAtUtc
                                       FROM dbo.FindingReviewEvents
                                       WHERE TenantId = @TenantId
                                         AND WorkspaceId = @WorkspaceId
                                         AND ProjectId = @ScopeProjectId
                                         AND FindingId = @FindingId
                                         AND Disposition IS NOT NULL
                                       ORDER BY OccurredAtUtc DESC;

                                       SELECT COUNT_BIG(1)
                                       FROM dbo.RiskExceptions
                                       WHERE TenantId = @TenantId
                                         AND WorkspaceId = @WorkspaceId
                                         AND ProjectId = @ScopeProjectId
                                         AND FindingId = @FindingId
                                         AND Status = @ActiveStatus
                                         AND ExpiresAtUtc > SYSUTCDATETIME();
                                       """;
}
