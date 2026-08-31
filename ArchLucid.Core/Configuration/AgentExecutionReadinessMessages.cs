namespace ArchLucid.Core.Configuration;

/// <summary>Operator-facing copy when Real agent execution cannot reach a live completion stack.</summary>
public static class AgentExecutionReadinessMessages
{
    public const string LiveCompletionUnavailable =
        "Live LLM completions require Azure OpenAI to be configured on this host. " +
        "Switch to Simulator mode or configure AzureOpenAI credentials.";
}
