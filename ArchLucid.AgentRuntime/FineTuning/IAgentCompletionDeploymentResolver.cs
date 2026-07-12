namespace ArchLucid.AgentRuntime.FineTuning;

/// <summary>
///     Resolves the Azure OpenAI deployment name for agent completions, optionally routing opted-in tenants to a
///     promoted fine-tuned deployment.
/// </summary>
public interface IAgentCompletionDeploymentResolver
{
    /// <summary>
    ///     Returns the fine-tuned deployment when enabled, consented, and promoted; otherwise
    ///     <paramref name="defaultDeploymentName" />.
    /// </summary>
    Task<string> ResolveDeploymentNameAsync(
        Guid tenantId,
        string defaultDeploymentName,
        CancellationToken cancellationToken);
}
