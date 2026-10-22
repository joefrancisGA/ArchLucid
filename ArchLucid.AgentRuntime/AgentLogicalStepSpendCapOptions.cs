namespace ArchLucid.AgentRuntime;

/// <summary>
///     Hard cap on billed LLM completion attempts per logical agent step (TB-941).
/// </summary>
public sealed class AgentLogicalStepSpendCapOptions
{
    public const string SectionPath = "AgentExecution:LogicalStepSpendCap";

    /// <summary>
    ///     When &gt; 0, overrides the computed formula cap. When 0, uses
    ///     <see cref="ResolveMaxBilledAttempts"/> with schema remediation + Polly retry settings.
    /// </summary>
    public int MaxBilledCompletionAttemptsPerTask
    {
        get;
        set;
    }

    /// <summary>When false, only telemetry is emitted and no cap is enforced (tests / emergency override).</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    public void Normalize()
    {
        if (MaxBilledCompletionAttemptsPerTask < 0)
            MaxBilledCompletionAttemptsPerTask = 0;
    }

    /// <summary>
    ///     Documented upper bound: first attempt includes Polly retries; remediation attempts do not (TB-043).
    /// </summary>
    public static int ResolveMaxBilledAttempts(
        AgentLogicalStepSpendCapOptions capOptions,
        AgentSchemaRemediationOptions schemaOptions,
        AgentExecutionResilienceOptions resilienceOptions)
    {
        ArgumentNullException.ThrowIfNull(capOptions);
        ArgumentNullException.ThrowIfNull(schemaOptions);
        ArgumentNullException.ThrowIfNull(resilienceOptions);

        capOptions.Normalize();
        schemaOptions.Normalize();
        resilienceOptions.Normalize();

        if (capOptions.MaxBilledCompletionAttemptsPerTask > 0)
            return capOptions.MaxBilledCompletionAttemptsPerTask;

        int schemaAttempts = schemaOptions.MaxCompletionAttempts;
        int pollyPerPrimaryAttempt = 1 + resilienceOptions.LlmCallMaxRetryAttempts;

        return pollyPerPrimaryAttempt + Math.Max(0, schemaAttempts - 1);
    }
}
