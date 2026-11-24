/*
  427: IE-13 procedure-only remediation state UPDATE boundary.
  Narrowly reroutes the three production update families through owner-context
  modules; the runtime app role loses direct UPDATE on RemediationInstances.
  Keep SELECT/INSERT and approval/verification evidence append permissions.
  Database deployment/migrations run separately from runtime identity.
  Migration 426 is prerequisite for evidence immutability and DELETE denial.
*/

CREATE OR ALTER PROCEDURE dbo.uspRemediationUpdateScoped
    @TenantId UNIQUEIDENTIFIER,
    @WorkspaceId UNIQUEIDENTIFIER,
    @ProjectId UNIQUEIDENTIFIER,
    @InstanceId UNIQUEIDENTIFIER,
    @ExpectedRowVersion VARBINARY(8),
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
    @ApprovedByActorKey NVARCHAR(256),
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
    IF @ExpectedRowVersion IS NULL OR DATALENGTH(@ExpectedRowVersion) <> 8
        THROW 50427, N'Expected rowversion must be exactly eight bytes.', 1;
    -- An ordinary update cannot mint an approval or verification receipt.
    IF @Status IN (3, 6, 7)
        THROW 50427, N'Approval and verification require atomic provenance procedures.', 1;

    UPDATE dbo.RemediationInstances
    SET Status = @Status,
        CloudResourceId = @CloudResourceId,
        PathId = @PathId,
        PathNarrativeJson = @PathNarrativeJson,
        AssessmentId = @AssessmentId,
        ControlId = @ControlId,
        PreflightSnapshotId = @PreflightSnapshotId,
        ExecutionSnapshotId = @ExecutionSnapshotId,
        VerificationSnapshotId = @VerificationSnapshotId,
        WaveId = @WaveId,
        PreflightResultJson = @PreflightResultJson,
        VerificationResultJson = @VerificationResultJson,
        ApprovedByActorKey = @ApprovedByActorKey,
        UpdatedUtc = @UpdatedUtc,
        ApprovedUtc = @ApprovedUtc,
        ExecutedUtc = @ExecutedUtc,
        ChangeImplementedUtc = @ChangeImplementedUtc,
        VerifiedUtc = @VerifiedUtc,
        ClosedUtc = @ClosedUtc
    WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND InstanceId = @InstanceId
              AND RowVersion = @ExpectedRowVersion
      AND (
           (Status = 0 AND @Status IN (1, 2))
        OR (Status = 1 AND @Status = 2)
        OR (Status = 3 AND @Status = 4)
        OR (Status = 4 AND @Status = 5)
        OR (Status = 5 AND @Status = 9)
        OR (Status = 6 AND @Status = 8)
        -- The existing verification-association compensating write
        -- restores ChangeImplemented after a failed separate association.
        OR (Status = 6 AND @Status = 9 AND @VerifiedUtc IS NULL)
      )
      -- Once approved, the frozen preflight and approval provenance cannot
      -- be rewritten through the ordinary scoped mutation procedure.
      AND (Status < 3 OR NOT EXISTS (
          SELECT @CloudResourceId, @PathId, @PathNarrativeJson, @AssessmentId,
                 @ControlId, @PreflightSnapshotId, @PreflightResultJson,
                 @ApprovedByActorKey, @ApprovedUtc
          EXCEPT
          SELECT CloudResourceId, PathId, PathNarrativeJson, AssessmentId,
                 ControlId, PreflightSnapshotId, PreflightResultJson,
                 ApprovedByActorKey, ApprovedUtc
      ))
      AND (Status < 4 OR NOT EXISTS (SELECT @WaveId EXCEPT SELECT WaveId))
      AND (Status < 5 OR NOT EXISTS (
          SELECT @ExecutionSnapshotId, @ExecutedUtc
          EXCEPT SELECT ExecutionSnapshotId, ExecutedUtc
      ))
      -- Normal Verified -> Closed must retain the verified receipt fields.
      -- Only Verified -> ChangeImplemented compensation may clear them.
      AND (@Status <> 8 OR NOT EXISTS (
          SELECT @VerificationSnapshotId, @VerificationResultJson, @VerifiedUtc
          EXCEPT SELECT VerificationSnapshotId, VerificationResultJson, VerifiedUtc
      ));
    SELECT CAST(@@ROWCOUNT AS INT) AS UpdatedCount;
END;
GO

CREATE OR ALTER PROCEDURE dbo.uspRemediationCommitApproval
    @TenantId UNIQUEIDENTIFIER,
    @WorkspaceId UNIQUEIDENTIFIER,
    @ProjectId UNIQUEIDENTIFIER,
    @InstanceId UNIQUEIDENTIFIER,
    @ExpectedRowVersion VARBINARY(8),
    @ApprovedByActorKey NVARCHAR(256),
    @ApprovedUtc DATETIME2,
    @UpdatedUtc DATETIME2,
    @EvidenceId UNIQUEIDENTIFIER,
    @PayloadJson NVARCHAR(MAX),
    @ActorKey NVARCHAR(256),
    @CorrelationId NVARCHAR(128),
    @CreatedUtc DATETIME2
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @ExpectedRowVersion IS NULL OR DATALENGTH(@ExpectedRowVersion) <> 8
       OR @EvidenceId IS NULL OR @EvidenceId = '00000000-0000-0000-0000-000000000000'
       OR NULLIF(LTRIM(RTRIM(@ApprovedByActorKey)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@ActorKey)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@CorrelationId)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@PayloadJson)), N'') IS NULL
       OR @CreatedUtc IS NULL OR @ApprovedUtc IS NULL
       OR @CreatedUtc <> @ApprovedUtc OR @ActorKey <> @ApprovedByActorKey
        THROW 50427, N'Invalid scoped approval provenance.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        UPDATE dbo.RemediationInstances
        SET Status = 3,
            ApprovedByActorKey = @ApprovedByActorKey,
            ApprovedUtc = @ApprovedUtc,
            UpdatedUtc = @UpdatedUtc
        WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND InstanceId = @InstanceId
              AND RowVersion = @ExpectedRowVersion
          AND Status = 1
          AND PreflightSnapshotId IS NOT NULL
          AND PreflightResultJson IS NOT NULL
          AND LEN(LTRIM(RTRIM(PreflightResultJson))) > 0
          AND LOWER(LTRIM(RTRIM(CreatedByActorKey))) <> LOWER(@ApprovedByActorKey);
        IF @@ROWCOUNT <> 1
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT CAST(0 AS INT) AS UpdatedCount;
            RETURN;
        END;

        INSERT INTO dbo.RemediationEvidence
            (EvidenceId, InstanceId, TenantId, Phase, PayloadJson, ActorKey, CorrelationId, CreatedUtc)
        VALUES
            (@EvidenceId, @InstanceId, @TenantId, 4, @PayloadJson, @ActorKey, @CorrelationId, @CreatedUtc);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    SELECT CAST(1 AS INT) AS UpdatedCount;
END;
GO

CREATE OR ALTER PROCEDURE dbo.uspRemediationCommitVerification
    @TenantId UNIQUEIDENTIFIER,
    @WorkspaceId UNIQUEIDENTIFIER,
    @ProjectId UNIQUEIDENTIFIER,
    @InstanceId UNIQUEIDENTIFIER,
    @ExpectedRowVersion VARBINARY(8),
    @Status INT,
    @VerificationSnapshotId UNIQUEIDENTIFIER,
    @VerificationResultJson NVARCHAR(MAX),
    @VerifiedUtc DATETIME2,
    @UpdatedUtc DATETIME2,
    @EvidenceId UNIQUEIDENTIFIER,
    @PayloadJson NVARCHAR(MAX),
    @ActorKey NVARCHAR(256),
    @CorrelationId NVARCHAR(128),
    @CreatedUtc DATETIME2
WITH EXECUTE AS OWNER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @ExpectedRowVersion IS NULL OR DATALENGTH(@ExpectedRowVersion) <> 8
       OR @Status NOT IN (6, 7)
       OR @VerificationSnapshotId IS NULL
       OR @VerifiedUtc IS NULL OR @CreatedUtc IS NULL OR @CreatedUtc <> @VerifiedUtc
       OR @EvidenceId IS NULL OR @EvidenceId = '00000000-0000-0000-0000-000000000000'
       OR NULLIF(LTRIM(RTRIM(@ActorKey)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@CorrelationId)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@PayloadJson)), N'') IS NULL
       OR @VerificationResultJson IS NULL
       OR @PayloadJson <> @VerificationResultJson
        THROW 50427, N'Invalid scoped verification provenance.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;
        UPDATE dbo.RemediationInstances
        SET Status = @Status,
            VerificationSnapshotId = @VerificationSnapshotId,
            VerificationResultJson = @VerificationResultJson,
            VerifiedUtc = @VerifiedUtc,
            UpdatedUtc = @UpdatedUtc
        WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
              AND InstanceId = @InstanceId
              AND RowVersion = @ExpectedRowVersion
          AND Status = 9;
        IF @@ROWCOUNT <> 1
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT CAST(0 AS INT) AS UpdatedCount;
            RETURN;
        END;

        INSERT INTO dbo.RemediationEvidence
            (EvidenceId, InstanceId, TenantId, Phase, PayloadJson, ActorKey, CorrelationId, CreatedUtc)
        VALUES
            (@EvidenceId, @InstanceId, @TenantId, 3, @PayloadJson, @ActorKey, @CorrelationId, @CreatedUtc);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
    SELECT CAST(1 AS INT) AS UpdatedCount;
END;
GO

IF DATABASE_PRINCIPAL_ID(N'ArchLucidApp') IS NOT NULL
BEGIN
    GRANT EXECUTE ON OBJECT::dbo.uspRemediationUpdateScoped TO [ArchLucidApp];
    GRANT EXECUTE ON OBJECT::dbo.uspRemediationCommitApproval TO [ArchLucidApp];
    GRANT EXECUTE ON OBJECT::dbo.uspRemediationCommitVerification TO [ArchLucidApp];
    DENY UPDATE ON OBJECT::dbo.RemediationInstances TO [ArchLucidApp];
END;
GO
