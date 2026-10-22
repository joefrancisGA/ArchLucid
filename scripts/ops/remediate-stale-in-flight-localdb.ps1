# Remediate stale in-flight runs (LocalDB / dev SQL)
#
# Soft-archives non-terminal runs older than 1 hour so data_consistency readiness can recover.
# Requires QUOTED_IDENTIFIER ON for filtered indexes on dbo.Runs.

param(
    [string]$ServerInstance = '(localdb)\mssqllocaldb',
    [string]$Database = 'ArchLucid'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$query = @"
SET QUOTED_IDENTIFIER ON;
SELECT COUNT(*) AS StaleBefore
FROM dbo.Runs r
WHERE r.ArchivedUtc IS NULL
  AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
  AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME());

UPDATE dbo.Runs
SET ArchivedUtc = SYSUTCDATETIME()
WHERE ArchivedUtc IS NULL
  AND LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
  AND CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME());

SELECT @@ROWCOUNT AS ArchivedRows;
"@

sqlcmd -S $ServerInstance -d $Database -E -C -I -Q $query

Write-Host 'Restart the API or wait for the next data-consistency reconciliation pass to refresh /health/ready.'
