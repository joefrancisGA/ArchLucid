/* 231: TB-052 explainability join ids + prompt refs + warnings on authority traces. */
IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'ContextSnapshotId') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD ContextSnapshotId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'GraphSnapshotId') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD GraphSnapshotId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'FindingsSnapshotId') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD FindingsSnapshotId UNIQUEIDENTIFIER NULL;
GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'PromptRefsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD PromptRefsJson NVARCHAR(MAX) NULL;
GO

IF OBJECT_ID(N'dbo.DecisioningTraces', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.DecisioningTraces', N'WarningsJson') IS NULL
    ALTER TABLE dbo.DecisioningTraces ADD WarningsJson NVARCHAR(MAX) NULL;
GO
