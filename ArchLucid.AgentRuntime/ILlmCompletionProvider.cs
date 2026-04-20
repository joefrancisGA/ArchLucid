namespace ArchLucid.AgentRuntime;

/// <summary>
/// Chat completion pipeline with explicit telemetry labels; same calls as <see cref="IAgentCompletionClient"/> / <see cref="ILlmProvider"/>.
/// </summary>
/// <remarks>
/// <see cref="ProviderId"/> and <see cref="ModelDeploymentLabel"/> align with <see cref="ILlmProvider.Descriptor"/> when using <see cref="DelegatingLlmCompletionProvider"/>.
/// </remarks>
public interface ILlmCompletionProvider : IAgentCompletionClient
{
    /// <summary>Logical provider id (e.g. <c>azure-openai</c>, <c>fake</c>); mirrors <see cref="ILlmProvider.Descriptor"/>.ProviderKind for the delegating provider.</summary>
    string ProviderId
    {
        get;
    }

    /// <summary>Deployment or model label; mirrors <see cref="ILlmProvider.Descriptor"/>.ModelId for the delegating provider.</summary>
    string ModelDeploymentLabel
    {
        get;
    }
}
