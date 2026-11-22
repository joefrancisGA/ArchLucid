/* FND-016: durable fail-closed remediation emergency-stop state.
   An absent row MUST mean stopped, not enabled. Changes require independent
   privileged control-plane permissions. No execution worker is wired here. */
SET NOCOUNT ON;
GO
IF OBJECT_ID(N'dbo.RemediationEmergencyStop',N'U') IS NULL
BEGIN
 CREATE TABLE dbo.RemediationEmergencyStop(
   TenantId UNIQUEIDENTIFIER NOT NULL,
   ProjectId UNIQUEIDENTIFIER NOT NULL,
   StopActive BIT NOT NULL,
   Generation BIGINT NOT NULL,
   UpdatedUtc DATETIMEOFFSET(7) NOT NULL
      CONSTRAINT DF_RemediationStop_Updated DEFAULT SYSUTCDATETIME(),
   Reason NVARCHAR(256) NOT NULL,
   CONSTRAINT PK_RemediationEmergencyStop PRIMARY KEY(TenantId,ProjectId),
   CONSTRAINT CK_RemediationStop_Generation CHECK(Generation > 0)
 );
END;
GO
CREATE OR ALTER PROCEDURE dbo.ReadRemediationEmergencyStop
 @tenant UNIQUEIDENTIFIER, @project UNIQUEIDENTIFIER
AS
BEGIN
 SET NOCOUNT ON;
 SELECT StopActive,Generation,UpdatedUtc
 FROM dbo.RemediationEmergencyStop
 WHERE TenantId=@tenant AND ProjectId=@project;
END;
GO
/* Separate privileged identity required for this mutation procedure. */
CREATE OR ALTER PROCEDURE dbo.SetRemediationEmergencyStop
 @tenant UNIQUEIDENTIFIER, @project UNIQUEIDENTIFIER,
 @stop BIT, @reason NVARCHAR(256), @expectedGeneration BIGINT = NULL
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 IF @reason IS NULL OR LEN(TRIM(@reason))=0 THROW 51160,'Stop reason required',1;
 BEGIN TRANSACTION;
 DECLARE @generation BIGINT;
 SELECT @generation=Generation FROM dbo.RemediationEmergencyStop WITH(UPDLOCK,HOLDLOCK)
 WHERE TenantId=@tenant AND ProjectId=@project;
 IF (@generation IS NULL AND @expectedGeneration IS NOT NULL)
   OR (@generation IS NOT NULL AND
       (@expectedGeneration IS NULL OR @expectedGeneration<>@generation))
 BEGIN
   ROLLBACK TRANSACTION;
   THROW 51161,'Emergency stop generation conflict',1;
 END;
 IF @generation IS NULL
   INSERT dbo.RemediationEmergencyStop(TenantId,ProjectId,StopActive,Generation,Reason)
   VALUES(@tenant,@project,@stop,1,@reason);
 ELSE
   UPDATE dbo.RemediationEmergencyStop SET StopActive=@stop,
      Generation=@generation+1, UpdatedUtc=SYSUTCDATETIME(),Reason=@reason
   WHERE TenantId=@tenant AND ProjectId=@project;
 COMMIT TRANSACTION;
END;
GO
