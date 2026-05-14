namespace ArchLucid.Core.Hosting;

/// <summary>Budgets for configuration-lint connectivity probes (must stay fast for CLI/API callers).</summary>
public static class AzureOpenAiEndpointConnectivityLintLimits
{
    /// <summary>Hard cap for DNS + TCP connect attempt to the Azure OpenAI authority.</summary>
    public static readonly TimeSpan SocketProbeTimeout = TimeSpan.FromSeconds(2);
}
