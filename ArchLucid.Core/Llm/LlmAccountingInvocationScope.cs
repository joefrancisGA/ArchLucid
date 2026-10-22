using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Llm;

/// <summary>
///     Bounded invoke classification for LLM token accounting (TB-015 Phase A).
/// </summary>
public enum LlmInvokeKind
{
    Primary = 0,
    SemanticJudge = 1,
    Explanation = 2,
    Ask = 3,
    Unknown = 4,
}

/// <summary>
///     Async-local scope propagated from agent handlers to <see cref="AgentRuntime.LlmCompletionAccountingClient" />.
/// </summary>
public readonly struct LlmAccountingInvocationScope : IDisposable
{
    private static readonly AsyncLocal<LlmAccountingInvocationScope?> Current = new();

    public LlmAccountingInvocationScope(AgentType? agentKind, LlmInvokeKind invokeKind)
    {
        AgentKind = agentKind;
        InvokeKind = invokeKind;
    }

    public AgentType? AgentKind { get; }

    public LlmInvokeKind InvokeKind { get; }

    public static LlmAccountingInvocationScope? GetCurrent()
    {
        return Current.Value;
    }

    public static LlmAccountingInvocationScope Begin(AgentType agentKind, LlmInvokeKind invokeKind = LlmInvokeKind.Primary)
    {
        LlmAccountingInvocationScope scope = new(agentKind, invokeKind);
        Current.Value = scope;

        return scope;
    }

    public static LlmAccountingInvocationScope Begin(LlmInvokeKind invokeKind, AgentType? agentKind = null)
    {
        LlmAccountingInvocationScope scope = new(agentKind, invokeKind);
        Current.Value = scope;

        return scope;
    }

    public void Dispose()
    {
        Current.Value = null;
    }

    public string ResolveConsumeRoleLabel()
    {
        if (AgentKind is null)
            return "Unknown";

        return AgentKind.Value.ToString();
    }

    public string ResolveInvokeKindLabel()
    {
        return InvokeKind.ToString();
    }
}
