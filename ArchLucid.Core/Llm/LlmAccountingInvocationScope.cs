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
    private sealed record ScopeFrame(LlmAccountingInvocationScope Scope);

    private static readonly AsyncLocal<ScopeFrame?> Current = new();
    private readonly ScopeFrame? _previous;

    public LlmAccountingInvocationScope(AgentType? agentKind, LlmInvokeKind invokeKind)
    {
        _previous = Current.Value;
        AgentKind = agentKind;
        InvokeKind = invokeKind;
    }

    public AgentType? AgentKind { get; }

    public LlmInvokeKind InvokeKind { get; }

    public static LlmAccountingInvocationScope? GetCurrent()
    {
        return Current.Value?.Scope;
    }

    public static LlmAccountingInvocationScope Begin(AgentType agentKind, LlmInvokeKind invokeKind = LlmInvokeKind.Primary)
    {
        LlmAccountingInvocationScope scope = new(agentKind, invokeKind);
        Current.Value = new ScopeFrame(scope);

        return scope;
    }

    public static LlmAccountingInvocationScope Begin(LlmInvokeKind invokeKind, AgentType? agentKind = null)
    {
        LlmAccountingInvocationScope scope = new(agentKind, invokeKind);
        Current.Value = new ScopeFrame(scope);

        return scope;
    }

    public void Dispose()
    {
        Current.Value = _previous;
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
