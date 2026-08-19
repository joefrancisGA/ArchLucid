/*
  Roll back DbUp 210 — dbo.ProductLearningPilotSignals.ArchitectureRunId UNIQUEIDENTIFIER -> NVARCHAR(64) (nullable, no FK).

  Restore stores CONVERT(NVARCHAR(36), guid); extended data loss when values were not RFC GUID strings on legacy rows.
*/

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.ProductLearningPilotSignals', N'ArchitectureRunId') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ProductLearningPilotSignals')
         AND c.name = N'ArchitectureRunId'
         AND ty.name = N'uniqueidentifier')
BEGIN
    ALTER TABLE dbo.ProductLearningPilotSignals ADD ArchitectureRunIdRevert NVARCHAR(64) NULL;

    UPDATE dbo.ProductLearningPilotSignals
    SET ArchitectureRunIdRevert = CONVERT(NVARCHAR(36), ArchitectureRunId)
    WHERE ArchitectureRunId IS NOT NULL;

    ALTER TABLE dbo.ProductLearningPilotSignals DROP COLUMN ArchitectureRunId;

    EXEC sp_rename N'dbo.ProductLearningPilotSignals.ArchitectureRunIdRevert', N'ArchitectureRunId', N'COLUMN';
END;
GO
