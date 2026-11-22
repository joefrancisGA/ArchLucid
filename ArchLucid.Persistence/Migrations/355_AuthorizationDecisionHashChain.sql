/* FND-010 hash-chain v1. New records only; historic journal rows are not backfilled.
   Hash = SHA256(0x01 || previous_hash || SHA256(canonical_payload)).
   Canonical payload is deterministic UTF-16LE JSON emitted by SQL Server FOR JSON PATH
   in fixed property order. Verifiers MUST use the stored payload bytes, not reserialize.
*/
SET NOCOUNT ON;
GO
IF OBJECT_ID(N'dbo.AuthorizationDecisionChain', N'U') IS NULL
BEGIN
 CREATE TABLE dbo.AuthorizationDecisionChain(
   SequenceNo BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_AuthorizationDecisionChain PRIMARY KEY,
   DecisionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT UQ_AuthorizationDecisionChain_Decision UNIQUE,
   Payload VARBINARY(MAX) NOT NULL,
   PreviousHash VARBINARY(32) NOT NULL,
   RecordHash VARBINARY(32) NOT NULL,
   CONSTRAINT FK_AuthorizationDecisionChain_Journal FOREIGN KEY(DecisionId)
      REFERENCES dbo.AuthorizationDecisionJournal(DecisionId)
 );
END;
GO
CREATE OR ALTER TRIGGER dbo.TR_AuthorizationDecisionChain_NoMutation
ON dbo.AuthorizationDecisionChain AFTER UPDATE, DELETE
AS BEGIN
 SET NOCOUNT ON;
 THROW 51055, 'Authorization hash chain is append-only.', 1;
END;
GO
CREATE OR ALTER PROCEDURE dbo.AppendAuthorizationDecision
 @decision UNIQUEIDENTIFIER, @tenant UNIQUEIDENTIFIER,
 @workspace UNIQUEIDENTIFIER, @project UNIQUEIDENTIFIER,
 @resource UNIQUEIDENTIFIER, @action NVARCHAR(128),
 @allowed BIT, @reason NVARCHAR(128), @caller NVARCHAR(64),
 @occurred DATETIMEOFFSET(7)
AS
BEGIN
 SET NOCOUNT ON;
 SET XACT_ABORT ON;
 BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @lockResult INT;
  EXEC @lockResult = sys.sp_getapplock
     @Resource=N'FND010.AuthorizationDecisionChain.v1',
     @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=10000;
  IF @lockResult < 0 THROW 51056, 'Audit chain lock unavailable.', 1;
  DECLARE @previous VARBINARY(32) = (
    SELECT TOP(1) RecordHash FROM dbo.AuthorizationDecisionChain
    ORDER BY SequenceNo DESC
  );
  IF @previous IS NULL SET @previous = CONVERT(VARBINARY(32), REPLICATE('0',64),2);
  DECLARE @payload VARBINARY(MAX) = CONVERT(VARBINARY(MAX),(
    SELECT CONVERT(NVARCHAR(36),@decision) AS decisionId,
           CONVERT(NVARCHAR(36),@tenant) AS tenantId,
           CONVERT(NVARCHAR(36),@workspace) AS workspaceId,
           CONVERT(NVARCHAR(36),@project) AS projectId,
           CONVERT(NVARCHAR(36),@resource) AS resourceId,
           @action AS actionName, @allowed AS allowed,
           @reason AS reasonCode, @caller AS callerKind,
           CONVERT(NVARCHAR(40),@occurred,127) AS occurredUtc
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER, INCLUDE_NULL_VALUES
  ));
  DECLARE @digest VARBINARY(32) = HASHBYTES('SHA2_256', @payload);
  DECLARE @recordHash VARBINARY(32) =
    HASHBYTES('SHA2_256', 0x01 + @previous + @digest);
  INSERT dbo.AuthorizationDecisionJournal
    (DecisionId,TenantId,WorkspaceId,ProjectId,ResourceId,
     ActionName,Allowed,ReasonCode,CallerKind,OccurredUtc)
  VALUES (@decision,@tenant,@workspace,@project,@resource,
          @action,@allowed,@reason,@caller,@occurred);
  INSERT dbo.AuthorizationDecisionChain
    (DecisionId,Payload,PreviousHash,RecordHash)
  VALUES (@decision,@payload,@previous,@recordHash);
  COMMIT TRANSACTION;
 END TRY
 BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
 END CATCH
END;
GO
