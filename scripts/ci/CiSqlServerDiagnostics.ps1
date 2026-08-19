# Best-effort SQL Server diagnostics for CI (GHA Linux runners lack host sqlcmd).
Set-StrictMode -Version Latest

function Get-CiSqlCmdInvocation {
    param(
        [string]$Server = '127.0.0.1,1433',

        [Parameter(Mandatory)]
        [string]$SaPassword
    )

    $hostSqlCmd = '/opt/mssql-tools18/bin/sqlcmd'

    if (Test-Path -LiteralPath $hostSqlCmd) {
        return @{
            Mode = 'host'
            SqlCmd = $hostSqlCmd
            Server = $Server
            SaPassword = $SaPassword
        }
    }

    $pathSqlCmd = Get-Command -Name sqlcmd -ErrorAction SilentlyContinue

    if ($null -ne $pathSqlCmd) {
        return @{
            Mode = 'host'
            SqlCmd = $pathSqlCmd.Source
            Server = $Server
            SaPassword = $SaPassword
        }
    }

    return @{
        Mode = 'docker'
        Image = 'mcr.microsoft.com/mssql/server:2022-latest'
        Server = $Server
        SaPassword = $SaPassword
    }
}

function Invoke-CiSqlCmdQuery {
    param(
        [Parameter(Mandatory)]
        [hashtable]$Invocation,

        [Parameter(Mandatory)]
        [string]$Title,

        [Parameter(Mandatory)]
        [string]$Query
    )

    Write-Host "--- $Title ---"

    try {
        if ($Invocation.Mode -eq 'docker') {
            & docker run --rm --network host `
                --entrypoint /opt/mssql-tools18/bin/sqlcmd `
                $Invocation.Image `
                -S $Invocation.Server `
                -U sa `
                -P $Invocation.SaPassword `
                -C `
                -Q $Query

            if ($LASTEXITCODE -ne 0) {
                Write-Host "(docker sqlcmd failed for: $Title, exit code $LASTEXITCODE)"
            }

            return
        }

        & $Invocation.SqlCmd `
            -S $Invocation.Server `
            -U sa `
            -P $Invocation.SaPassword `
            -C `
            -Q $Query

        if ($LASTEXITCODE -ne 0) {
            Write-Host "(sqlcmd failed for: $Title, exit code $LASTEXITCODE)"
        }
    }
    catch {
        Write-Host "(sqlcmd skipped for: $Title — $($_.Exception.Message))"
    }
}

function Write-CiSqlServerHangDiagnostics {
    param(
        [string]$Server = '127.0.0.1,1433',

        [string]$SaPassword = 'LocalTesting123!'
    )

    if ($env:ARCHLUCID_CI_SQL_SA_PASSWORD) {
        $SaPassword = $env:ARCHLUCID_CI_SQL_SA_PASSWORD
    }

    Write-Host ("=== SQL Server post-hang diagnostics: {0} ===" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss UTC' -AsUTC))

    $invocation = Get-CiSqlCmdInvocation -Server $Server -SaPassword $SaPassword

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Active requests (session_id > 50)' -Query @'
SELECT session_id, status, command, blocking_session_id,
       wait_type, wait_time AS wait_time_ms, last_wait_type, wait_resource,
       cpu_time, total_elapsed_time, reads, writes, logical_reads,
       DB_NAME(database_id) AS db_name,
       LEFT(sql_text.text, 300) AS sql_snippet
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) AS sql_text
WHERE session_id > 50
ORDER BY wait_time DESC;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Waiting tasks (session_id > 50)' -Query @'
SELECT session_id, blocking_session_id, wait_type,
       wait_duration_ms, resource_description
FROM sys.dm_os_waiting_tasks
WHERE session_id > 50
ORDER BY wait_duration_ms DESC;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Blocked waiter count' -Query @'
SELECT COUNT(*) AS blocked_session_count
FROM sys.dm_os_waiting_tasks
WHERE blocking_session_id IS NOT NULL AND blocking_session_id <> 0;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Open transactions' -Query @'
SELECT s.session_id,
       at.transaction_begin_time,
       at.transaction_type,
       at.transaction_state,
       DB_NAME(dt.database_id) AS db_name
FROM sys.dm_tran_session_transactions s
INNER JOIN sys.dm_tran_active_transactions at
    ON at.transaction_id = s.transaction_id
LEFT JOIN sys.dm_tran_database_transactions dt
    ON dt.transaction_id = at.transaction_id
ORDER BY at.transaction_begin_time ASC;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Sessions / connections (session_id > 50)' -Query @'
SELECT session_id, status, login_name, host_name, program_name,
       open_transaction_count,
       last_request_start_time, last_request_end_time
FROM sys.dm_exec_sessions
WHERE session_id > 50
ORDER BY last_request_start_time DESC;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'ArchLucid catalogs' -Query @'
SELECT name, state_desc, create_date, log_reuse_wait_desc
FROM sys.databases
WHERE name LIKE 'ArchLucid%'
ORDER BY name;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Database sizes (ArchLucid)' -Query @'
SELECT DB_NAME(database_id) AS db_name,
       SUM(size) * 8 / 1024 AS size_mb
FROM sys.master_files
WHERE DB_NAME(database_id) LIKE 'ArchLucid%'
GROUP BY database_id
ORDER BY size_mb DESC;
'@
}
