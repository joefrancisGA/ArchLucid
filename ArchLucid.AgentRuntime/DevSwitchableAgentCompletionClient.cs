using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Development-only <see cref="IAgentCompletionClient" /> that routes to the offline simulator completion client or
///     the live Azure/Echo pipeline based on <see cref="IEffectiveAgentExecutionModeAccessor" />.
/// </summary>
public sealed class DevSwitchableAgentCompletionClient(
    IEffectiveAgentExecutionModeAccessor effectiveModeAccessor,
    IAgentCompletionClient simulatorCompletionClient,
    IAgentCompletionClient? realCompletionClient,
    ILogger<DevSwitchableAgentCompletionClient> logger) : IAgentCompletionClient
{
    /// <summary>
    ///     Thrown when the effective mode is Real but no live completion pipeline was registered on the host.
    /// </summary>
    public const string LiveCompletionUnavailableMessage = AgentExecutionReadinessMessages.LiveCompletionUnavailable;

    private readonly IEffectiveAgentExecutionModeAccessor _effectiveModeAccessor =
        effectiveModeAccessor ?? throw new ArgumentNullException(nameof(effectiveModeAccessor));

    private readonly IAgentCompletionClient _simulatorCompletionClient =
        simulatorCompletionClient ?? throw new ArgumentNullException(nameof(simulatorCompletionClient));

    private readonly IAgentCompletionClient? _realCompletionClient = realCompletionClient;

    private readonly ILogger<DevSwitchableAgentCompletionClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor =>
        ResolveClient().Descriptor;

    /// <inheritdoc />
    public Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        return ResolveClient().CompleteJsonAsync(
            systemPrompt,
            userPrompt,
            maxTokens,
            temperature,
            cancellationToken);
    }

    private IAgentCompletionClient ResolveClient()
    {
        bool useSimulator = string.Equals(
            _effectiveModeAccessor.GetEffectiveMode(),
            DevAgentExecutionModeHeaderNames.Simulator,
            StringComparison.OrdinalIgnoreCase);

        if (useSimulator)
            return _simulatorCompletionClient;

        if (_realCompletionClient is not null)
            return _realCompletionClient;

        _logger.LogWarning(
            "Dev agent execution mode is Real but no live completion pipeline is registered on this host.");

        throw new InvalidOperationException(LiveCompletionUnavailableMessage);
    }
}
