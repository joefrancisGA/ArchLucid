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
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        if (!_optionsMonitor.CurrentValue.Enabled)
            return await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

        LlmTelemetryLabelOptions labels = _telemetryLabels.CurrentValue;
        LlmCompletionCacheOptions cacheOpts = _optionsMonitor.CurrentValue;

        string agentType = string.IsNullOrWhiteSpace(labels.ProviderId) ? "unknown" : labels.ProviderId.Trim();
        string modelName = string.IsNullOrWhiteSpace(labels.ModelDeploymentLabel)
            ? "unknown"
            : labels.ModelDeploymentLabel.Trim();

        string promptHash = LlmCompletionCacheFingerprint.ComputePromptHash(systemPrompt, userPrompt);
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        EnsureScopePartitionAllowsCache(cacheOpts.PartitionByScope, scope, _simulator);

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

        string result = await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

        await _cache.SetAsync(cacheKey, new LlmCompletionResult(result), cancellationToken);

        return result;
    }

    /// <summary>
    ///     Production runs must not shard cache keys with an empty tenant when partition semantics are requested; simulator
    ///     hosts remain exempt because they deliberately lack tenant scope plumbing.
    /// </summary>
    private static void EnsureScopePartitionAllowsCache(bool partitionByScope, ScopeContext scope, bool simulatorMode)
    {
        if (simulatorMode || !partitionByScope)
            return;

        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId != Guid.Empty)
            return;

        throw new InvalidOperationException(
            "AgentRuntime CompletionCache.PartitionByScope is enabled but the ambient tenant scope id is empty. " +
            "Refusing completion cache lookups to prevent cross-scope cache bleed when prompts collide.");
    }
}
