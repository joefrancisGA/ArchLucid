#requires -Version 5.1
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/ci/tests/FirstPilotConsolidatedAiReadinessGate.Tests.ps1'

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
. (Join-Path $repoRoot 'scripts/FirstPilotAiQualityProof.ps1')
. (Join-Path $repoRoot 'scripts/FirstPilotConsolidatedAiReadinessGate.ps1')

Describe 'Consolidated AI readiness gate disposition' {
    It 'Returns PASS when sponsor-safe AI posture is attested' {
        $observability = [pscustomobject]@{
            llmExecutionMode                                      = 'real'
            qualityGateMode                                       = 'PilotStrict'
            qualityGateDisposition                                = 'pilot-strict-sponsor-evidence-pass'
            pilotStrictMinAgentResultFaithfulnessSupportRatio     = 0.7
            unresolvedQualitySignalsPresent                       = $false
            llmCallCountResolved                                  = $true
            rawPromptOrCompletionIncluded                       = $false
            secretsIncluded                                     = $false
            llmBudgetStatusCollected                              = $true
            llmBudgetStatus                                       = [pscustomobject]@{ blocksAdditionalLlmExecution = $false; monthlyBudgetMonitoringActive = $true }
        }
        $grounding = [ordered]@{ resolved = $true; retrievalGroundingTracePresent = $true; traceCount = 2; meanCitationCoverage = 0.82 }
        $gate = Build-ConsolidatedAiReadinessGate -Observability $observability -RetrievalGroundingSummary $grounding -RetrievalIrStatus ([ordered]@{ status = 'present' }) -AiQualityProof $null
        $result = Resolve-ConsolidatedAiReadinessDisposition -Gate $gate -SponsorHandoff

        $result.disposition | Should Be 'PASS'
    }

    It 'Returns HOLD on sponsor handoff when real-mode disposition fails' {
        $observability = [pscustomobject]@{
            llmExecutionMode                                      = 'real'
            qualityGateMode                                       = 'PilotStrict'
            qualityGateDisposition                                = 'pilot-strict-violates-sponsor-evidence'
            pilotStrictMinAgentResultFaithfulnessSupportRatio     = 0.7
            unresolvedQualitySignalsPresent                       = $false
            llmCallCountResolved                                  = $true
            rawPromptOrCompletionIncluded                       = $false
            secretsIncluded                                     = $false
            llmBudgetStatusCollected                              = $false
            llmBudgetStatus                                       = $null
        }
        $grounding = [ordered]@{ resolved = $true; retrievalGroundingTracePresent = $true; traceCount = 1; meanCitationCoverage = 0.5 }
        $gate = Build-ConsolidatedAiReadinessGate -Observability $observability -RetrievalGroundingSummary $grounding -RetrievalIrStatus ([ordered]@{ status = 'not-collected' }) -AiQualityProof $null
        $result = Resolve-ConsolidatedAiReadinessDisposition -Gate $gate -SponsorHandoff

        $result.disposition | Should Be 'HOLD'
    }

    It 'Returns WARN for simulator-only posture without claiming real LLM proof' {
        $observability = [pscustomobject]@{
            llmExecutionMode                                      = 'simulator'
            qualityGateMode                                       = 'WarnOnly'
            qualityGateDisposition                                = 'not-collected'
            pilotStrictMinAgentResultFaithfulnessSupportRatio     = $null
            unresolvedQualitySignalsPresent                       = $false
            llmCallCountResolved                                  = $true
            rawPromptOrCompletionIncluded                       = $false
            secretsIncluded                                     = $false
            llmBudgetStatusCollected                              = $false
            llmBudgetStatus                                       = $null
        }
        $gate = Build-ConsolidatedAiReadinessGate -Observability $observability -RetrievalGroundingSummary $null -RetrievalIrStatus ([ordered]@{ status = 'not-collected' }) -AiQualityProof $null
        $result = Resolve-ConsolidatedAiReadinessDisposition -Gate $gate

        $result.disposition | Should Be 'WARN'
        $gate.simulatorOnlyPosture | Should Be $true
    }

    It 'Maps HOLD to BLOCK when sponsor handoff is enabled' {
        Map-ConsolidatedAiReadinessToProofFindingDisposition -GateDisposition 'HOLD' -SponsorHandoff | Should Be 'BLOCK'
    }

    It 'Maps HOLD to WARN for readiness-only runs' {
        Map-ConsolidatedAiReadinessToProofFindingDisposition -GateDisposition 'HOLD' | Should Be 'WARN'
    }
}
