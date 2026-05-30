namespace ArchLucid.Application.Runs;

using ArchLucid.Contracts.Agents;

/// <summary>
///     Operator triage catalog for real-agent failures (assessment improvement #23). No secrets or raw LLM bodies.
/// </summary>
public static class RealAgentFailureTriageCatalog
{
    public static IReadOnlyList<RealAgentFailureTriageEntry> All { get; } =
    [
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.MissingCredentials,
            Title = "Missing Azure OpenAI credentials or deployment config",
            FailureClasses = [AgentExecutionFailureClasses.MissingCredentials],
            OperatorNextSteps =
            [
                "Confirm AgentExecution:Mode is Real only when AOAI is intentionally enabled.",
                "Run archlucid config lint --profile production-like-hosted-pilot (or your hosted profile).",
                "Verify AzureOpenAI:Endpoint, AzureOpenAI:DeploymentName, and secret-backed ApiKey (or managed identity transport).",
                "Check /health/ready for AzureOpenAI probe status before re-executing the run.",
            ],
            RelatedDocPaths =
            [
                "docs/library/CONFIGURATION_REFERENCE.md",
                "docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md",
            ],
        },
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.ContentSafetyRejection,
            Title = "Content safety blocked prompt or model output",
            FailureClasses = [AgentExecutionFailureClasses.ContentSafety],
            OperatorNextSteps =
            [
                "Review whether the architecture request or uploaded context triggered a high-severity category.",
                "Confirm ArchLucid:ContentSafety:Endpoint and ApiKey for production-like hosts.",
                "If the block is expected, redact or rephrase sensitive input; do not disable fail-closed in Production/Staging.",
                "Inspect AgentExecutionTraces for parseSuccess=false rows without copying raw prompts into tickets.",
            ],
            RelatedDocPaths =
            [
                "docs/library/CONFIGURATION_REFERENCE.md",
                "docs/runbooks/AGENT_EXECUTION_FAILURES.md",
            ],
        },
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.SchemaViolation,
            Title = "Agent result JSON failed schema or parse validation",
            FailureClasses = [AgentExecutionFailureClasses.Parse],
            OperatorNextSteps =
            [
                "Confirm SchemaValidation:AgentResultSchemaPath exists on the host and matches the deployed contract version.",
                "Check AgentExecution:SchemaValidation:EnforceOnParse for the environment profile.",
                "If Real mode, verify AzureOpenAI:UseJsonSchemaResponseFormat and provider fallback behavior in logs.",
                "Re-execute after schema or deployment alignment; do not paste raw model JSON into external channels.",
            ],
            RelatedDocPaths =
            [
                "docs/library/CONFIGURATION_REFERENCE.md",
                "docs/runbooks/AGENT_EXECUTION_FAILURES.md",
            ],
        },
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.GroundingInsufficiency,
            Title = "Output quality gate rejected grounding or structural bar",
            FailureClasses = [AgentExecutionFailureClasses.QualityGate],
            OperatorNextSteps =
            [
                "Inspect run status ExecutionCompletedQualityRejected and trace qualityRejected=true rows.",
                "Add retrieval evidence or richer architecture context before retrying (PilotStrict floors apply).",
                "Review ArchLucid:AgentOutput:QualityGate:Mode and PilotStrictMinAgentResultFaithfulnessSupportRatio.",
                "For sponsor pilots, prefer HOLD proof-packet disposition over weakening gates.",
            ],
            RelatedDocPaths =
            [
                "docs/library/CONFIGURATION_REFERENCE.md",
                "docs/runbooks/AGENT_EXECUTION_FAILURES.md",
            ],
        },
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.Timeout,
            Title = "Agent or LLM call timed out",
            FailureClasses = [AgentExecutionFailureClasses.Timeout],
            OperatorNextSteps =
            [
                "Check network egress, private endpoint DNS, and Azure OpenAI regional latency.",
                "Review Polly timeout and retry settings on the completion client path.",
                "Retry execute once infrastructure is stable; escalate if timeouts cluster across tenants.",
            ],
            RelatedDocPaths =
            [
                "docs/runbooks/AGENT_EXECUTION_FAILURES.md",
                "docs/library/FIRST_REAL_VALUE.md",
            ],
        },
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.BudgetCutoff,
            Title = "Token quota or run cost budget cutoff",
            FailureClasses =
            [
                AgentExecutionFailureClasses.CostBudget,
                AgentExecutionFailureClasses.Quota,
            ],
            OperatorNextSteps =
            [
                "Identify whether failureClass is costBudget (per-run cap) or quota (tenant sliding window).",
                "Review LLM budget command-center settings and tenant daily token limits.",
                "For pilots, adjust caps deliberately rather than disabling CostGuardrail in production-like hosts.",
                "Re-execute after budget reset or owner-approved cap increase.",
            ],
            RelatedDocPaths =
            [
                "docs/library/CONFIGURATION_REFERENCE.md",
                "docs/runbooks/AGENT_EXECUTION_FAILURES.md",
            ],
        },
        new RealAgentFailureTriageEntry
        {
            ScenarioId = RealAgentFailureTriageScenarioIds.FallbackToSimulator,
            Title = "Real-mode path fell back to simulator results",
            FailureClasses = [],
            OperatorNextSteps =
            [
                "Confirm Runs.RealModeFellBackToSimulator=true and review FirstRealValueRunFellBackToSimulator audit event.",
                "Fix underlying AOAI or execute failure before treating the run as live-model buyer evidence.",
                "Use archlucid try --real --strict-real in CI/smoke to prevent silent fallback.",
                "Mark proof-packet and sponsor artifacts HOLD when fallback occurred unless explicitly disclosed.",
            ],
            RelatedDocPaths =
            [
                "docs/library/FIRST_REAL_VALUE.md",
                "docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md",
            ],
        },
    ];

    public static RealAgentFailureTriageEntry? TryGet(string scenarioId)
    {
        if (string.IsNullOrWhiteSpace(scenarioId))
        {
            return null;
        }

        foreach (RealAgentFailureTriageEntry entry in All)
        {
            if (string.Equals(entry.ScenarioId, scenarioId, StringComparison.OrdinalIgnoreCase))
            {
                return entry;
            }
        }

        return null;
    }
}
