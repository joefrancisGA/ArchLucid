using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Decorator around <see cref="IAgentCompletionClient" /> that caches successful JSON completions in-process with OTel
///     counters.
/// </summary>
public sealed class CachingLlmCompletionClient : IAgentCompletionClient
{
    private readonly ILlmCompletionResponseCache _cache;
    private readonly IAgentCompletionClient _inner;

    private readonly ILogger<CachingLlmCompletionClient> _logger;
    private readonly IOptionsMonitor<LlmCompletionCacheOptions> _optionsMonitor;
    private readonly IScopeContextProvider _scopeProvider;
    private readonly bool _simulator;
    private readonly IOptionsMonitor<LlmTelemetryLabelOptions> _telemetryLabels;

    /// <summary>Creates the caching decorator.</summary>
    public CachingLlmCompletionClient(
        IAgentCompletionClient inner,
        ILlmCompletionResponseCache cache,
        bool simulatorMode,
        IScopeContextProvider scopeProvider,
        IOptionsMonitor<LlmCompletionCacheOptions> optionsMonitor,
        IOptionsMonitor<LlmTelemetryLabelOptions> telemetryLabels,
        ILogger<CachingLlmCompletionClient> logger)
    {
        ArgumentNullException.ThrowIfNull(inner);
        ArgumentNullException.ThrowIfNull(cache);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(optionsMonitor);
        ArgumentNullException.ThrowIfNull(telemetryLabels);
        ArgumentNullException.ThrowIfNull(logger);

        _inner = inner;
        _cache = cache;
        _simulator = simulatorMode;
        _scopeProvider = scopeProvider;
        _optionsMonitor = optionsMonitor;
        _telemetryLabels = telemetryLabels;
        _logger = logger;

        ArchLucidInstrumentation.EnsureLlmCompletionCacheObservableInstrumentsRegistered();
    }

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    /// <inheritdoc />
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        if (!_optionsMonitor.CurrentValue.Enabled)
            return await _inner.CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        LlmTelemetryLabelOptions labels = _telemetryLabels.CurrentValue;
        LlmCompletionCacheOptions cacheOpts = _optionsMonitor.CurrentValue;

        string agentType = string.IsNullOrWhiteSpace(labels.ProviderId) ? "unknown" : labels.ProviderId.Trim();
        string modelName = string.IsNullOrWhiteSpace(labels.ModelDeploymentLabel)
            ? "unknown"
            : labels.ModelDeploymentLabel.Trim();

        string promptHash = LlmCompletionCacheFingerprint.ComputePromptHash(systemPrompt, userPrompt);
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        string scopePartition = cacheOpts.PartitionByScope
            ? LlmCompletionCacheFingerprint.FormatScopePartition(scope)
            : string.Empty;

        LlmCompletionCacheKey cacheKey =
            new(agentType, modelName, promptHash, _simulator, scopePartition);

        LlmCompletionResult? cached = await _cache.TryGetAsync(cacheKey, cancellationToken);

        if (cached is not null)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug(
                    "LLM completion response cache hit (agent_type {AgentType}, model {Model}, simulator {Simulator}).",
                    agentType,
                    modelName,
                    _simulator);

            ArchLucidInstrumentation.RecordLlmCompletionCacheHit(agentType);

            return cached.JsonBody;
        }

        ArchLucidInstrumentation.RecordLlmCompletionCacheMiss(agentType);

        string result = await _inner.CompleteJsonAsync(systemPrompt, userPrompt, cancellationToken);

        await _cache.SetAsync(cacheKey, new LlmCompletionResult(result), cancellationToken);

        return result;
    }
}
