namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <summary>
///     Named Dapper statements for <c>dbo.ProductLearningPilotSignals</c>. Kept out of method bodies so
///     aggregation SQL can be reviewed and compared without scrolling through repository orchestration.
/// </summary>
internal static class ProductLearningPilotSignalSql
{
    /// <summary>
    ///     Grouping length for repeated-comment themes. The <c>LEFT(..., N)</c> literals must stay aligned with
    ///     <see cref="ProductLearningSignalAggregations.CommentThemePrefixLength" /> (no string interpolation — analyzers
    ///     and reviewers treat interpolated SQL as higher risk).
    /// </summary>
    public const string RepeatedCommentTheme = """
                                               SELECT TOP (@Take)
                                                   ThemeKey,
                                                   OccurrenceCount,
                                                   FirstSeenUtc,
                                                   LastSeenUtc,
                                                   SampleCommentShort
                                               FROM (
                                                   SELECT
                                                       LEFT(LTRIM(RTRIM(CommentShort)), 200) AS ThemeKey,
                                                       COUNT_BIG(*) AS OccurrenceCount,
                                                       MIN(RecordedUtc) AS FirstSeenUtc,
                                                       MAX(RecordedUtc) AS LastSeenUtc,
                                                       MIN(CommentShort) AS SampleCommentShort
                                                   FROM dbo.ProductLearningPilotSignals
                                                   WHERE TenantId = @TenantId
                                                     AND WorkspaceId = @WorkspaceId
                                                     AND ProjectId = @ProjectId
                                                     AND (@SinceUtc IS NULL OR RecordedUtc >= @SinceUtc)
                                                     AND CommentShort IS NOT NULL
                                                     AND LEN(LTRIM(RTRIM(CommentShort))) > 0
                                                   GROUP BY LEFT(LTRIM(RTRIM(CommentShort)), 200)
                                                   HAVING COUNT_BIG(*) >= @MinOccurrences
                                               ) t
                                               ORDER BY OccurrenceCount DESC, ThemeKey ASC;
                                               """;

    public const string Insert = """
                                 INSERT INTO dbo.ProductLearningPilotSignals
                                 (
                                     SignalId,
                                     TenantId,
                                     WorkspaceId,
                                     ProjectId,
                                     ArchitectureRunId,
                                     AuthorityRunId,
                                     ManifestVersion,
                                     SubjectType,
                                     Disposition,
                                     PatternKey,
                                     ArtifactHint,
                                     CommentShort,
                                     DetailJson,
                                     RecordedByUserId,
                                     RecordedByDisplayName,
                                     RecordedUtc,
                                     TriageStatus
                                 )
                                 VALUES
                                 (
                                     @SignalId,
                                     @TenantId,
                                     @WorkspaceId,
                                     @ProjectId,
                                     @ArchitectureRunId,
                                     @AuthorityRunId,
                                     @ManifestVersion,
                                     @SubjectType,
                                     @Disposition,
                                     @PatternKey,
                                     @ArtifactHint,
                                     @CommentShort,
                                     @DetailJson,
                                     @RecordedByUserId,
                                     @RecordedByDisplayName,
                                     @RecordedUtc,
                                     @TriageStatus
                                 );
                                 """;

    public const string ListRecentForScope = """
                                             SELECT TOP (@Take)
                                                 SignalId,
                                                 TenantId,
                                                 WorkspaceId,
                                                 ProjectId,
                                                 ArchitectureRunId,
                                                 AuthorityRunId,
                                                 ManifestVersion,
                                                 SubjectType,
                                                 Disposition,
                                                 PatternKey,
                                                 ArtifactHint,
                                                 CommentShort,
                                                 DetailJson,
                                                 RecordedByUserId,
                                                 RecordedByDisplayName,
                                                 RecordedUtc,
                                                 TriageStatus
                                             FROM dbo.ProductLearningPilotSignals
                                             WHERE TenantId = @TenantId
                                               AND WorkspaceId = @WorkspaceId
                                               AND ProjectId = @ProjectId
                                             ORDER BY RecordedUtc DESC;
                                             """;

    public const string ListRunFeedbackAggregates = """
                                                    ;WITH Scoped AS (
                                                        SELECT *
                                                        FROM dbo.ProductLearningPilotSignals
                                                        WHERE TenantId = @TenantId
                                                          AND WorkspaceId = @WorkspaceId
                                                          AND ProjectId = @ProjectId
                                                          AND (@SinceUtc IS NULL OR RecordedUtc >= @SinceUtc)
                                                    ),
                                                    Agg AS (
                                                        SELECT
                                                            CASE
                                                                WHEN NULLIF(LTRIM(RTRIM(ISNULL(PatternKey, N''))), N'') IS NOT NULL
                                                                    THEN LTRIM(RTRIM(PatternKey))
                                                                ELSE CONCAT(
                                                                        N'subject:',
                                                                        SubjectType,
                                                                        N'|artifact:',
                                                                        COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'--'))
                                                            END AS AggregateKey,
                                                            MIN(PatternKey) AS PatternKeyRaw,
                                                            MIN(SubjectType) AS SubjectTypeOrWorkflowArea,
                                                            COUNT_BIG(*) AS TotalSignalCount,
                                                            COUNT(DISTINCT CASE
                                                                WHEN ArchitectureRunId IS NOT NULL AND LTRIM(RTRIM(ArchitectureRunId)) <> N''
                                                                    THEN ArchitectureRunId
                                                                END) AS DistinctRunCount,
                                                            SUM(CASE WHEN Disposition = N'Trusted' THEN 1 ELSE 0 END) AS TrustedCount,
                                                            SUM(CASE WHEN Disposition = N'Rejected' THEN 1 ELSE 0 END) AS RejectedCount,
                                                            SUM(CASE WHEN Disposition = N'Revised' THEN 1 ELSE 0 END) AS RevisedCount,
                                                            SUM(CASE WHEN Disposition = N'NeedsFollowUp' THEN 1 ELSE 0 END) AS NeedsFollowUpCount,
                                                            MIN(NULLIF(LTRIM(RTRIM(CommentShort)), N'')) AS DominantThemeHint,
                                                            MIN(RecordedUtc) AS FirstSignalRecordedUtc,
                                                            MAX(RecordedUtc) AS LastSignalRecordedUtc
                                                        FROM Scoped
                                                        GROUP BY
                                                            CASE
                                                                WHEN NULLIF(LTRIM(RTRIM(ISNULL(PatternKey, N''))), N'') IS NOT NULL
                                                                    THEN LTRIM(RTRIM(PatternKey))
                                                                ELSE CONCAT(
                                                                        N'subject:',
                                                                        SubjectType,
                                                                        N'|artifact:',
                                                                        COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'--'))
                                                            END
                                                    )
                                                    SELECT TOP (@MaxAggregates)
                                                        AggregateKey,
                                                        PatternKeyRaw,
                                                        SubjectTypeOrWorkflowArea,
                                                        DistinctRunCount,
                                                        TotalSignalCount,
                                                        TrustedCount,
                                                        RejectedCount,
                                                        RevisedCount,
                                                        NeedsFollowUpCount,
                                                        DominantThemeHint,
                                                        FirstSignalRecordedUtc,
                                                        LastSignalRecordedUtc
                                                    FROM Agg
                                                    ORDER BY LastSignalRecordedUtc DESC, AggregateKey ASC;
                                                    """;

    public const string ListArtifactOutcomeTrends = """
                                                    ;WITH Scoped AS (
                                                        SELECT *
                                                        FROM dbo.ProductLearningPilotSignals
                                                        WHERE TenantId = @TenantId
                                                          AND WorkspaceId = @WorkspaceId
                                                          AND ProjectId = @ProjectId
                                                          AND (@SinceUtc IS NULL OR RecordedUtc >= @SinceUtc)
                                                    ),
                                                    Trend AS (
                                                        SELECT
                                                            CONCAT(
                                                                SubjectType,
                                                                N'|',
                                                                COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'*')) AS TrendKey,
                                                            -- Must only use GROUP BY keys / aggregates (SQL 8120). Empty hint falls back to SubjectType
                                                            -- to match ProductLearningSignalAggregations.BuildArtifactTypeOrHint — not the '*' group sentinel.
                                                            CASE
                                                                WHEN COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'*') = N'*'
                                                                    THEN SubjectType
                                                                ELSE COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'*')
                                                            END AS ArtifactTypeOrHint,
                                                            SUM(CASE WHEN Disposition = N'Trusted' THEN 1 ELSE 0 END) AS AcceptedOrTrustedCount,
                                                            SUM(CASE WHEN Disposition = N'Revised' THEN 1 ELSE 0 END) AS RevisionCount,
                                                            SUM(CASE WHEN Disposition = N'Rejected' THEN 1 ELSE 0 END) AS RejectionCount,
                                                            SUM(CASE WHEN Disposition = N'NeedsFollowUp' THEN 1 ELSE 0 END) AS NeedsFollowUpCount,
                                                            COUNT(DISTINCT CASE
                                                                WHEN ArchitectureRunId IS NOT NULL AND LTRIM(RTRIM(ArchitectureRunId)) <> N''
                                                                    THEN ArchitectureRunId
                                                                END) AS DistinctRunCount,
                                                            MIN(NULLIF(LTRIM(RTRIM(CommentShort)), N'')) AS RepeatedThemeIndicator,
                                                            MIN(RecordedUtc) AS FirstSeenUtc,
                                                            MAX(RecordedUtc) AS LastSeenUtc,
                                                            SUM(CASE
                                                                WHEN Disposition IN (N'Rejected', N'Revised', N'NeedsFollowUp') THEN 1
                                                                ELSE 0
                                                            END) AS NegativeSignalWeight
                                                        FROM Scoped
                                                        GROUP BY
                                                            SubjectType,
                                                            COALESCE(NULLIF(LTRIM(RTRIM(ArtifactHint)), N''), N'*')
                                                    )
                                                    SELECT TOP (@MaxTrends)
                                                        TrendKey,
                                                        ArtifactTypeOrHint,
                                                        AcceptedOrTrustedCount,
                                                        RevisionCount,
                                                        RejectionCount,
                                                        NeedsFollowUpCount,
                                                        DistinctRunCount,
                                                        RepeatedThemeIndicator,
                                                        FirstSeenUtc,
                                                        LastSeenUtc
                                                    FROM Trend
                                                    ORDER BY NegativeSignalWeight DESC, TrendKey ASC;
                                                    """;

    public const string CountSignalsInScope = """
                                              SELECT COUNT_BIG(*)
                                              FROM dbo.ProductLearningPilotSignals
                                              WHERE TenantId = @TenantId
                                                AND WorkspaceId = @WorkspaceId
                                                AND ProjectId = @ProjectId
                                                AND (@SinceUtc IS NULL OR RecordedUtc >= @SinceUtc);
                                              """;

    public const string CountDistinctArchitectureRunsWithSignals = """
                                                                   SELECT COUNT(DISTINCT ArchitectureRunId)
                                                                   FROM dbo.ProductLearningPilotSignals
                                                                   WHERE TenantId = @TenantId
                                                                     AND WorkspaceId = @WorkspaceId
                                                                     AND ProjectId = @ProjectId
                                                                     AND (@SinceUtc IS NULL OR RecordedUtc >= @SinceUtc)
                                                                     AND ArchitectureRunId IS NOT NULL
                                                                     AND LTRIM(RTRIM(ArchitectureRunId)) <> N'';
                                                                   """;
}
