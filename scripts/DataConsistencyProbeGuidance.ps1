#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-DataConsistencyProbeGuidance {
    param([Parameter(Mandatory = $true)][string] $Probe)

    switch ($Probe) {
        '/health/ready' {
            return [ordered]@{
                riskMeaning            = 'API host is not ready — SQL, migrations, or subsystem checks failed.'
                remediation            = 'Inspect /health/ready JSON, DbUp logs, and connection strings; rerun after fix.'
                runbookLink            = 'docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md'
                sponsorHandoffMustStop = $true
            }
        }
        '/health/diagnostics' {
            return [ordered]@{
                riskMeaning            = 'Deep diagnostics unavailable — often missing admin API key or auth.'
                remediation            = 'Supply BearerToken/ApiKey and rerun; review /health/diagnostics for SQL and probe sections.'
                runbookLink            = 'docs/library/DATA_CONSISTENCY_MATRIX.md'
                sponsorHandoffMustStop = $false
            }
        }
        '/v1/admin/diagnostics/data-consistency/orphans' {
            return [ordered]@{
                riskMeaning            = 'Orphan rows break run/manifest authority convergence and sponsor trust.'
                remediation            = 'Review orphan counts, run dry-run remediation via documented admin routes only.'
                runbookLink            = 'docs/library/DATA_CONSISTENCY_MATRIX.md'
                sponsorHandoffMustStop = $true
            }
        }
        default {
            return [ordered]@{
                riskMeaning            = 'Data consistency probe reported an unexpected status.'
                remediation            = 'Capture support bundle and review data-consistency readiness output.'
                runbookLink            = 'docs/runbooks/DATA_CONSISTENCY_READINESS.md'
                sponsorHandoffMustStop = $false
            }
        }
    }
}
