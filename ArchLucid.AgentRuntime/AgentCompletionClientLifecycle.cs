namespace ArchLucid.AgentRuntime;

/// <summary>Disposes completion-client decorator chains created outside DI-owned <see cref="IDisposable" /> registrations.</summary>
public static class AgentCompletionClientLifecycle
{
    public static void DisposeIfDisposable(IAgentCompletionClient? client)
    {
        if (client is IDisposable disposable)

            disposable.Dispose();
    }
}
