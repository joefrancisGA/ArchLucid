namespace ArchLucid.Core.Audit;

// Agent execution integrity: schema/trace failures, quality gates, model profiles, LLM budgets, and resilience.
public static partial class AuditEventTypes
{
    /// <summary>
    ///     Agent LLM output failed <c>AgentResult</c> JSON schema validation at parse time (payload lists errors and
    ///     model metadata when known).
    /// </summary>
    public const string AgentResultSchemaViolation = "AgentResultSchemaViolation";

    /// <summary>Full agent trace prompt/response blob persistence failed or timed out after agent trace row insert.</summary>
    public const string AgentTraceBlobPersistenceFailed = "AgentTraceBlobPersistenceFailed";

    /// <summary>
    ///     Mandatory SQL inline fallback for full agent trace text failed or forensic coverage verification failed after
    ///     blob issues.
    /// </summary>
    public const string AgentTraceInlineFallbackFailed = "AgentTraceInlineFallbackFailed";

    public const string TenantAgentOutputQualityGateModeUpdated = "Tenant.AgentOutputQualityGateModeUpdated";

    public const string TenantAgentOutputQualityGateModeOverrideCleared = "Tenant.AgentOutputQualityGateModeOverrideCleared";

    /// <summary>Quality-gate definition version deprecated with successor (TB-974 wrong-definition playbook).</summary>
    public const string TenantQualityGateDefinitionDeprecated = "Tenant.QualityGateDefinitionDeprecated";

    /// <summary>Append-only superseding evaluation recorded for a run/trace (TB-974).</summary>
    public const string RunQualityGateSupersedingEvaluationRecorded = "Run.QualityGateSupersedingEvaluationRecorded";

    /// <summary>Workspace default model execution profile changed (<c>PUT /v1/admin/settings/model-execution-profile</c>).</summary>
    public const string WorkspaceModelExecutionProfileUpdated = "Workspace.ModelExecutionProfileUpdated";

    /// <summary>Workspace model execution profile tenant override cleared (<c>DELETE /v1/admin/settings/model-execution-profile</c>).</summary>
    public const string WorkspaceModelExecutionProfileOverrideCleared = "Workspace.ModelExecutionProfileOverrideCleared";

    /// <summary>Per-review model execution profile override applied at run create (TB-870).</summary>
    public const string RunModelExecutionProfileOverrideApplied = "Run.ModelExecutionProfileOverrideApplied";

    /// <summary>Phase B LLM faithfulness judge scored below warn floor on one agent trace (run continues for other traces).</summary>
    public const string AgentOutputLlmFaithfulnessWarned = "AgentOutput.LlmFaithfulnessWarned";

    /// <summary>Phase B LLM faithfulness judge scored below reject floor on one agent trace.</summary>
    public const string AgentOutputLlmFaithfulnessRejected = "AgentOutput.LlmFaithfulnessRejected";

    /// <summary>LLM prompt truncated because estimated tokens exceeded the configured context threshold.</summary>
    public const string LlmContextTruncated = "LlmContextTruncated";

    /// <summary>LLM evidence summarized because estimated prompt tokens exceeded the configured context threshold.</summary>
    public const string LlmEvidenceSummarized = "LlmEvidenceSummarized";

    /// <summary>Azure AI Content Safety circuit is open/unhealthy; analyzer fell back to local deny-list redaction.</summary>
    public const string ContentSafetyCircuitDegradedFallback = "ContentSafetyCircuitDegradedFallback";

    /// <summary>
    ///     Tenant crossed the configured warn threshold for the UTC-day combined LLM token budget (emitted at most once
    ///     per tenant per UTC day).
    /// </summary>
    public const string LlmTenantDailyBudgetApproaching = "LlmTenantDailyBudgetApproaching";

    /// <summary>
    ///     Tenant crossed the configured warn threshold for the UTC-month estimated LLM dollar budget (emitted at most once
    ///     per tenant per UTC month).
    /// </summary>
    public const string LlmTenantMonthlyDollarBudgetApproaching = "LlmTenantMonthlyDollarBudgetApproaching";

    /// <summary>LLM prepaid wallet auto-refill succeeded (Stripe PaymentIntent).</summary>
    public const string LlmWalletRefillSucceeded = "LlmWalletRefillSucceeded";

    /// <summary>LLM prepaid wallet auto-refill failed (card declined or Stripe error).</summary>
    public const string LlmWalletRefillFailed = "LlmWalletRefillFailed";

    /// <summary>Operator updated LLM prepaid wallet settings (auto-replenish, monthly cap, payment method).</summary>
    public const string LlmWalletSettingsUpdated = "LlmWalletSettingsUpdated";

    /// <summary>Admin updated persisted LLM USD-per-token rates used for cost estimation (input/output).</summary>
    public const string LlmCostTuningUpdated = "LlmCostTuningUpdated";

    public const string CircuitBreakerStateTransition = "CircuitBreakerStateTransition";

    public const string CircuitBreakerRejection = "CircuitBreakerRejection";

    public const string CircuitBreakerProbeOutcome = "CircuitBreakerProbeOutcome";
}
