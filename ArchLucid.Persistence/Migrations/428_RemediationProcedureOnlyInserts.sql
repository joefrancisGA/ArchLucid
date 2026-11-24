/*
  428: IE-13 procedure-only remediation INSERT boundary.
  Keep approval and verification in the atomic CAS modules from 427.
*/
CREATE OR ALTER PROCEDURE dbo.uspRemediationCreateScoped
    @InstanceId UNIQUEIDENTIFIER,
    @TenantId UNIQUEIDENTIFIER,
    @WorkspaceId UNIQUEIDENTIFIER,
    @ProjectId UNIQUEIDENTIFIER,
    @FindingId UNIQUEIDENTIFIER,
    @PatternId UNIQUEIDENTIFIER,
    @PatternVersionId UNIQUEIDENTIFIER,
    @PatternKey NVARCHAR(256),
    @FrozenPatternVersion NVARCHAR(64),
    @AutomationLevel INT,
    @Status INT,
    @CloudResourceId UNIQUEIDENTIFIER,
    @PathId UNIQUEIDENTIFIER,
    @PathNarrativeJson NVARCHAR(MAX),
    @AssessmentId UNIQUEIDENTIFIER,
    @ControlId UNIQUEIDENTIFIER,
    @PreflightSnapshotId UNIQUEIDENTIFIER,
    @ExecutionSnapshotId UNIQUEIDENTIFIER,
    @VerificationSnapshotId UNIQUEIDENTIFIER,
    @WaveId UNIQUEIDENTIFIER,
    @PreflightResultJson NVARCHAR(MAX),
    @VerificationResultJson NVARCHAR(MAX),
    @CreatedByActorKey NVARCHAR(256),
    @ApprovedByActorKey NVARCHAR(256),
    @CreatedUtc DATETIME2,
    @UpdatedUtc DATETIME2,
    @ApprovedUtc DATETIME2,
    @ExecutedUtc DATETIME2,
    @ChangeImplementedUtc DATETIME2,
    @VerifiedUtc DATETIME2,
    @ClosedUtc DATETIME2
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    IF @Status IS NULL OR @Status <> 0
       OR @PreflightSnapshotId IS NOT NULL OR @ExecutionSnapshotId IS NOT NULL
       OR @VerificationSnapshotId IS NOT NULL OR @WaveId IS NOT NULL
       OR @PreflightResultJson IS NOT NULL OR @VerificationResultJson IS NOT NULL
       OR @ApprovedByActorKey IS NOT NULL OR @ApprovedUtc IS NOT NULL
       OR @ExecutedUtc IS NOT NULL OR @ChangeImplementedUtc IS NOT NULL
       OR @VerifiedUtc IS NOT NULL OR @ClosedUtc IS NOT NULL
       OR NULLIF(LTRIM(RTRIM(@CreatedByActorKey)), N'') IS NULL
        THROW 50428, N'Only initial Classified remediation instances may be created.', 1;

    INSERT INTO dbo.RemediationInstances
        (InstanceId, TenantId, WorkspaceId, ProjectId, FindingId, PatternId, PatternVersionId,
         PatternKey, FrozenPatternVersion, AutomationLevel, Status, CloudResourceId, PathId,
         PathNarrativeJson, AssessmentId, ControlId, CreatedByActorKey, CreatedUtc, UpdatedUtc)
    SELECT @InstanceId, @TenantId, @WorkspaceId, @ProjectId, @FindingId, @PatternId, @PatternVersionId,
           @PatternKey, @FrozenPatternVersion, @AutomationLevel, 0, @CloudResourceId, @PathId,
           @PathNarrativeJson, @AssessmentId, @ControlId, @CreatedByActorKey, @CreatedUtc, @UpdatedUtc
    WHERE EXISTS (
        SELECT 1 FROM dbo.OperationalSecurityFindings
        WHERE FindingId = @FindingId AND TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
    ) AND EXISTS (
        SELECT 1 FROM dbo.RemediationPatternVersions v
        INNER JOIN dbo.RemediationPatterns p
            ON p.PatternId = v.PatternId AND p.TenantId = v.TenantId
        WHERE v.VersionId = @PatternVersionId AND v.PatternId = @PatternId
          AND v.TenantId = @TenantId AND v.Version = @FrozenPatternVersion
          AND p.PatternKey = @PatternKey AND v.AutomationLevel = @AutomationLevel
          AND v.Status = 2
    );
    IF @@ROWCOUNT <> 1
        THROW 50428, N'Remediation creation requires a scoped finding and matching approved pattern version.', 1;
END;
GO

CREATE OR ALTER PROCEDURE dbo.uspRemediationAppendEvidenceScoped
    @TenantId UNIQUEIDENTIFIER,
    @WorkspaceId UNIQUEIDENTIFIER,
    @ProjectId UNIQUEIDENTIFIER,
    @EvidenceId UNIQUEIDENTIFIER,
    @InstanceId UNIQUEIDENTIFIER,
    @Phase INT,
    @PayloadJson NVARCHAR(MAX),
    @ActorKey NVARCHAR(256),
    @CorrelationId NVARCHAR(128),
    @CreatedUtc DATETIME2
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    IF @Phase IS NULL OR @Phase NOT IN (0, 1, 2)
       OR @EvidenceId IS NULL OR @EvidenceId = '00000000-0000-0000-0000-000000000000'
       OR NULLIF(LTRIM(RTRIM(@PayloadJson)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@ActorKey)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@CorrelationId)), N'') IS NULL
       OR @CreatedUtc IS NULL
        THROW 50428, N'Invalid ordinary remediation evidence; approval and verification require atomic procedures.', 1;

    INSERT INTO dbo.RemediationEvidence
        (EvidenceId, InstanceId, TenantId, Phase, PayloadJson, ActorKey, CorrelationId, CreatedUtc)
    SELECT @EvidenceId, @InstanceId, @TenantId, @Phase, @PayloadJson, @ActorKey, @CorrelationId, @CreatedUtc
    FROM dbo.RemediationInstances
    WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId
      AND ProjectId = @ProjectId AND InstanceId = @InstanceId AND Status = 4
      -- Do not allow a fabricated request/result without its predecessor.
      -- The live advisory-only path writes Before -> ExecuteRequest -> ExecuteResult
      -- under the same actor and correlation ID, with monotonic timestamps.
      AND (@Phase = 0 OR EXISTS (
          SELECT 1
          FROM dbo.RemediationEvidence AS prior
          WHERE prior.TenantId = @TenantId
            AND prior.InstanceId = @InstanceId
            AND prior.Phase = @Phase - 1
            AND prior.ActorKey = @ActorKey
            AND prior.CorrelationId = @CorrelationId
            AND prior.CreatedUtc <= @CreatedUtc
      ));
    IF @@ROWCOUNT <> 1
        THROW 50428, N'Ordinary remediation evidence requires a scoped wave-assigned instance and its matching prior phase.', 1;
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    GRANT EXECUTE ON OBJECT::dbo.uspRemediationCreateScoped TO [ArchLucidApp];
    GRANT EXECUTE ON OBJECT::dbo.uspRemediationAppendEvidenceScoped TO [ArchLucidApp];
    DENY INSERT ON OBJECT::dbo.RemediationInstances TO [ArchLucidApp];
    DENY INSERT ON OBJECT::dbo.RemediationEvidence TO [ArchLucidApp];
END;
GO
