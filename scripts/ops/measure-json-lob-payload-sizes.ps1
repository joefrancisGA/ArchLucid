<#
.SYNOPSIS
  TB-932 evidence gate - run JSON LOB size distribution SQL against ArchLucid SQL.
#>
[CmdletBinding()]
param(
    [string] $ConnectionString = "",
    [string] $OutputPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$sqlPath = Join-Path $PSScriptRoot 'sql\tb932-json-lob-size-distribution.sql'

if (-not (Test-Path -LiteralPath $sqlPath)) {
    throw ('Missing SQL script: {0}' -f $sqlPath)
}

if ([string]::IsNullOrEmpty($ConnectionString)) {
    if (-not [string]::IsNullOrEmpty($env:ARCHLUCID_SQL_CONNECTION)) {
        $ConnectionString = $env:ARCHLUCID_SQL_CONNECTION
    }
    elseif (-not [string]::IsNullOrEmpty($env:ConnectionStrings__ArchLucid)) {
        $ConnectionString = $env:ConnectionStrings__ArchLucid
    }
}

Write-Host 'TB-932 - JSON LOB size distribution'
Write-Host ('SQL: {0}' -f $sqlPath)
Write-Host 'Decision template: docs/architecture/tb932_json_lob_blob_offload_decision.md'
Write-Host ""

if ([string]::IsNullOrEmpty($ConnectionString)) {
    Write-Host 'BLOCKED: no SQL connection string.'
    Write-Host 'Pass -ConnectionString or set ARCHLUCID_SQL_CONNECTION / ConnectionStrings__ArchLucid.'
    Write-Host 'Then paste results into the decision doc (implement vs Wont-do).'
    exit 2
}

$sqlText = [System.IO.File]::ReadAllText($sqlPath)
Add-Type -AssemblyName System.Data | Out-Null

$connection = New-Object System.Data.SqlClient.SqlConnection($ConnectionString)
$logLines = New-Object System.Collections.ArrayList

try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = $sqlText
    $command.CommandTimeout = 600
    $adapter = New-Object System.Data.SqlClient.SqlDataAdapter($command)
    $set = New-Object System.Data.DataSet
    [void]$adapter.Fill($set)

    foreach ($table in $set.Tables) {
        if ($table.Columns.Count -eq 0) {
            continue
        }

        $headerParts = New-Object System.Collections.ArrayList
        foreach ($col in $table.Columns) {
            [void]$headerParts.Add($col.ColumnName)
        }

        $header = [string]::Join("`t", $headerParts.ToArray())
        Write-Host $header
        [void]$logLines.Add($header)

        foreach ($row in $table.Rows) {
            $cellParts = New-Object System.Collections.ArrayList
            foreach ($col in $table.Columns) {
                [void]$cellParts.Add([string]$row[$col.ColumnName])
            }

            $line = [string]::Join("`t", $cellParts.ToArray())
            Write-Host $line
            [void]$logLines.Add($line)
        }

        Write-Host ""
        [void]$logLines.Add("")
    }
}
catch {
    Write-Host ('BLOCKED: SQL execution failed: {0}' -f $_.Exception.Message)
    exit 4
}
finally {
    if ($null -ne $connection) {
        if ($connection.State -ne [System.Data.ConnectionState]::Closed) {
            $connection.Close()
        }

        $connection.Dispose()
    }
}

if (-not [string]::IsNullOrEmpty($OutputPath)) {
    [System.IO.File]::WriteAllLines($OutputPath, $logLines.ToArray())
    Write-Host ('Wrote {0}' -f $OutputPath)
}

Write-Host 'Next: fill docs/architecture/tb932_json_lob_blob_offload_decision.md'
exit 0
