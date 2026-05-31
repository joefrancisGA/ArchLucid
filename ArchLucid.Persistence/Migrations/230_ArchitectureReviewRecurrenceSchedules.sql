/*
  TB-059–063 — automated follow-up architecture review recurrence schedules.
*/

IF OBJECT_ID(N'dbo.ArchitectureReviewRecurrenceSchedules', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ArchitectureReviewRecurrenceSchedules
    (
        ScheduleId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_ArchitectureReviewRecurrenceSchedules PRIMARY KEY,
        TenantId UNIQUEIDENTIFIER NOT NULL,
        WorkspaceId UNIQUEIDENTIFIER NOT NULL,
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        SourceRunId UNIQUEIDENTIFIER NOT NULL,
        Name NVARCHAR(300) NOT NULL,
        CronExpression NVARCHAR(100) NOT NULL,
        IsEnabled BIT NOT NULL,
        CreatedUtc DATETIME2 NOT NULL,
        CreatedByUserId NVARCHAR(256) NOT NULL,
        LastTriggeredUtc DATETIME2 NULL,
        LastTriggeredRunId UNIQUEIDENTIFIER NULL,
        NextRunUtc DATETIME2 NULL
    );

    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_Scope_Enabled_NextRun
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, WorkspaceId, ProjectId, IsEnabled, NextRunUtc);

    CREATE NONCLUSTERED INDEX IX_ArchitectureReviewRecurrenceSchedules_SourceRun
        ON dbo.ArchitectureReviewRecurrenceSchedules (TenantId, SourceRunId);
END;
GO
