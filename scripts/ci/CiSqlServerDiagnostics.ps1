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

    Write-Host '--- SQL Server diagnostics (post-hang) ---'

    $invocation = Get-CiSqlCmdInvocation -Server $Server -SaPassword $SaPassword

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Active requests (session_id > 50)' -Query @'
SELECT session_id, status, blocking_session_id, wait_type, wait_time_ms,
       DB_NAME(database_id) AS db_name, LEFT(sql_text.text, 200) AS sql_snippet
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) AS sql_text
WHERE session_id > 50
ORDER BY wait_time_ms DESC;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'Blocked waiter count' -Query @'
SELECT COUNT(*) AS blocked_session_count
FROM sys.dm_os_waiting_tasks
WHERE blocking_session_id IS NOT NULL AND blocking_session_id <> 0;
'@

    Invoke-CiSqlCmdQuery -Invocation $invocation -Title 'ArchLucid catalogs' -Query @'
SELECT name, state_desc, log_reuse_wait_desc
FROM sys.databases
WHERE name LIKE 'ArchLucid%'
ORDER BY name;
'@
}
