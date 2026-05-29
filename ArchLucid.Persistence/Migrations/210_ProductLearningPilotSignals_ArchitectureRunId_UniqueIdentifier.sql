/*
  Improvement #27 — dbo.ProductLearningPilotSignals.ArchitectureRunId NVARCHAR(64) -> UNIQUEIDENTIFIER (nullable, no FK).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NULL
BEGIN
    PRINT N'#27 ProductLearningPilotSignals: table missing; skipping.';
END;
GO

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ProductLearningPilotSignals', N'ArchitectureRunId') IS NULL
   AND COL_LENGTH(N'dbo.ProductLearningPilotSignals', N'ArchitectureRunIdGuid') IS NOT NULL
BEGIN
    EXEC sp_rename N'dbo.ProductLearningPilotSignals.ArchitectureRunIdGuid', N'ArchitectureRunId', N'COLUMN';
END;
GO

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ProductLearningPilotSignals')
         AND c.name = N'ArchitectureRunId'
         AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    IF COL_LENGTH(N'dbo.ProductLearningPilotSignals', N'ArchitectureRunIdGuid') IS NULL
        ALTER TABLE dbo.ProductLearningPilotSignals ADD ArchitectureRunIdGuid UNIQUEIDENTIFIER NULL;
END;
GO

IF OBJECT_ID(N'dbo.ProductLearningPilotSignals', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ProductLearningPilotSignals', N'ArchitectureRunIdGuid') IS NOT NULL
   AND EXISTS (
       SELECT 1
       FROM sys.columns c
       INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
       WHERE c.object_id = OBJECT_ID(N'dbo.ProductLearningPilotSignals')
         AND c.name = N'ArchitectureRunId'
         AND ty.name IN (N'nvarchar', N'varchar'))
BEGIN
    UPDATE dbo.ProductLearningPilotSignals
    SET ArchitectureRunIdGuid = TRY_CAST(ArchitectureRunId AS UNIQUEIDENTIFIER)
    WHERE ArchitectureRunIdGuid IS NULL
      AND ArchitectureRunId IS NOT NULL;

    ALTER TABLE dbo.ProductLearningPilotSignals DROP COLUMN ArchitectureRunId;

    EXEC sp_rename N'dbo.ProductLearningPilotSignals.ArchitectureRunIdGuid', N'ArchitectureRunId', N'COLUMN';
END;
GO
