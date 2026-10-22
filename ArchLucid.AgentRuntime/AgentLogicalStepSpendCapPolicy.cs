using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

/// <inheritdoc cref="IAgentLogicalStepSpendCapPolicy"/>
public sealed class AgentLogicalStepSpendCapPolicy : IAgentLogicalStepSpendCapPolicy
{
    private readonly IOptionsMonitor<AgentLogicalStepSpendCapOptions> _capOptions;

    private readonly IOptionsMonitor<AgentSchemaRemediationOptions> _schemaOptions;

    private readonly IOptionsMonitor<AgentExecutionResilienceOptions> _resilienceOptions;

    public AgentLogicalStepSpendCapPolicy(
        IOptionsMonitor<AgentLogicalStepSpendCapOptions> capOptions,
        IOptionsMonitor<AgentSchemaRemediationOptions> schemaOptions,
        IOptionsMonitor<AgentExecutionResilienceOptions> resilienceOptions)
    {
        ArgumentNullException.ThrowIfNull(capOptions);
        ArgumentNullException.ThrowIfNull(schemaOptions);
        ArgumentNullException.ThrowIfNull(resilienceOptions);

        _capOptions = capOptions;
        _schemaOptions = schemaOptions;
        _resilienceOptions = resilienceOptions;
    }

    /// <inheritdoc/>
    public int ResolveMaxBilledAttempts()
    {
        return AgentLogicalStepSpendCapOptions.ResolveMaxBilledAttempts(
            _capOptions.CurrentValue,
            _schemaOptions.CurrentValue,
            _resilienceOptions.CurrentValue);
    }

    /// <inheritdoc/>
    public void EnsureBilledAttemptAllowed()
    {
        AgentLogicalStepSpendCapOptions options = _capOptions.CurrentValue;

        if (!options.Enabled)
            return;

        AgentLogicalStepSpendScope? scope = AgentLogicalStepSpendScope.GetCurrent();

        if (scope is null)
            return;

        scope.RecordBilledAttempt(ResolveMaxBilledAttempts());
    }
}
