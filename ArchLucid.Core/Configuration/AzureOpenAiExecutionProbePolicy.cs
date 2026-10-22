using Microsoft.Extensions.Configuration;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Shared rule for when tooling should actively probe <c>AzureOpenAI:Endpoint</c> (Real agents against Azure, not Echo).
/// </summary>
public static class AzureOpenAiExecutionProbePolicy
{
    /// <summary>
    ///     True when <c>AgentExecution:Mode</c> is Real and completion client is not Echo (Azure traffic expected).
    /// </summary>
    public static bool ShouldProbeConfiguredEndpoint(IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(configuration);

        if (!string.Equals(
                configuration["AgentExecution:Mode"]?.Trim(),
                "Real",
                StringComparison.OrdinalIgnoreCase))
            return false;

        return !string.Equals(
            configuration["AgentExecution:CompletionClient"]?.Trim(),
            "Echo",
            StringComparison.OrdinalIgnoreCase);
    }
}
