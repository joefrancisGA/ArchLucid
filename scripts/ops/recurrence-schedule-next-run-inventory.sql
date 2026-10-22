/*
  Recurrence schedule cron inventory — run read-only before correcting NextRunUtc.
  See docs/architecture/RECURRENCE_SCHEDULE_CRON_MIGRATION.md
*/
SET NOCOUNT ON;

DECLARE @LegacyAllowList TABLE (CronExpression NVARCHAR(100) NOT NULL PRIMARY KEY);
INSERT INTO @LegacyAllowList (CronExpression)
VALUES
    (N'@hourly'),
    (N'@daily'),
    (N'@weekly'),
    (N'0 7 * * *');

SELECT
    COUNT(*) AS total_schedules,
    SUM(CASE WHEN LTRIM(RTRIM(s.CronExpression)) NOT IN (SELECT CronExpression FROM @LegacyAllowList) THEN 1 ELSE 0 END) AS likely_misinterpreted,
    SUM(CASE WHEN s.IsEnabled = 1 AND LTRIM(RTRIM(s.CronExpression)) NOT IN (SELECT CronExpression FROM @LegacyAllowList) THEN 1 ELSE 0 END) AS enabled_misinterpreted
FROM dbo.ArchitectureReviewRecurrenceSchedules AS s;

SELECT
    s.ScheduleId,
    s.TenantId,
    s.SourceRunId,
    s.Name,
    s.CronExpression,
    s.IsEnabled,
    s.NextRunUtc,
    s.LastTriggeredUtc,
    s.ConsecutiveFailureCount
FROM dbo.ArchitectureReviewRecurrenceSchedules AS s
WHERE LTRIM(RTRIM(s.CronExpression)) NOT IN (SELECT CronExpression FROM @LegacyAllowList)
ORDER BY s.IsEnabled DESC, s.NextRunUtc ASC;
