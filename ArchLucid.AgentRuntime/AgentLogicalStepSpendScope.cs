namespace ArchLucid.AgentRuntime;

using ArchLucid.Core;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm;

/// <summary>
///     Async-local billed-attempt counter for one agent handler invocation (TB-941).
/// </summary>
public sealed class AgentLogicalStepSpendScope : IDisposable
{
    private static readonly AsyncLocal<AgentLogicalStepSpendScope?> Current = new();

    private int _billedAttempts;

    private AgentLogicalStepSpendScope(string runId, string taskId)
    {
        RunId = runId;
        TaskId = taskId;
    }

    public string RunId
    {
        get;
    }

    public string TaskId
    {
        get;
    }

    public static AgentLogicalStepSpendScope? GetCurrent()
    {
        return Current.Value;
    }

    public static AgentLogicalStepSpendScope Begin(string runId, string taskId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentException.ThrowIfNullOrWhiteSpace(taskId);

        AgentLogicalStepSpendScope scope = new(runId.Trim(), taskId.Trim());
        Current.Value = scope;

        return scope;
    }

    /// <summary>Increments billed attempts and throws when the cap is exceeded.</summary>
    public void RecordBilledAttempt(int maxAttempts)
    {
        if (maxAttempts < 1)
            maxAttempts = 1;

        int observed = Interlocked.Increment(ref _billedAttempts);

        if (observed > maxAttempts)
        {
            LlmAccountingInvocationScope? accountingScope = LlmAccountingInvocationScope.GetCurrent();
            string agentTypeLabel = accountingScope?.AgentKind?.ToString() ?? "unknown";
            ArchLucidInstrumentation.RecordAgentLogicalStepSpendCapHit(agentTypeLabel);

            throw new AgentLogicalStepSpendCapExceededException(RunId, TaskId, maxAttempts, observed);
        }
    }

    public void Dispose()
    {
        Current.Value = null;
    }
}
