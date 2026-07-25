using System.Runtime.CompilerServices;

using ArchLucid.AgentRuntime.Caching;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Decorator that caches assistant JSON bodies for identical prompt pairs (and optional scope partition).
/// </summary>
/// <remarks>
///     Sits <em>inside</em> <see cref="CircuitBreakingAgentCompletionClient" /> so cache hits avoid Azure and do not
///     affect the breaker.
///     Backing store is <see cref="ILlmCompletionResponseStore" /> (memory or distributed Redis).
/// </remarks>
public sealed class CachingAgentCompletionClient : IAgentStreamingCompletionClient
{
    private const string CacheKeyPrefix = "llm:completion:v1:";
    private readonly string _deploymentName;
    private readonly bool _enabled;

    private readonly IAgentCompletionClient _inner;
    private readonly ILogger<CachingAgentCompletionClient> _logger;
    private readonly bool _partitionByScope;
    private readonly IScopeContextProvider _scopeProvider;
    private readonly ILlmCompletionResponseStore _store;
    private readonly TimeSpan _ttl;

    /// <summary>Creates a caching wrapper around <paramref name="inner" />.</summary>
    public CachingAgentCompletionClient(
        IAgentCompletionClient inner,
        ILlmCompletionResponseStore store,
        string deploymentName,
        bool enabled,
        bool partitionByScope,
        TimeSpan absoluteExpiration,
        IScopeContextProvider scopeProvider,
        ILogger<CachingAgentCompletionClient> logger)
    {
        ArgumentNullException.ThrowIfNull(inner);
        ArgumentNullException.ThrowIfNull(store);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);
        ArgumentNullException.ThrowIfNull(scopeProvider);
        ArgumentNullException.ThrowIfNull(logger);

        _inner = inner;
        _store = store;
        _deploymentName = deploymentName;
        _enabled = enabled;
        _partitionByScope = partitionByScope;
        _ttl = absoluteExpiration > TimeSpan.Zero
            ? absoluteExpiration
            : throw new ArgumentOutOfRangeException(nameof(absoluteExpiration));
        _scopeProvider = scopeProvider;
        _logger = logger;
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
        if (!_enabled)
            return await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        string key =
            CacheKeyPrefix
            + LlmCompletionCacheFingerprint.Compute(
                _partitionByScope,
                _deploymentName,
                systemPrompt,
                userPrompt,
                scope);

        string? cached = await _store.TryGetAsync(key, cancellationToken);

        if (LlmCompletionCacheWireAdmission.IsAdmissible(cached))
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug("LLM completion cache hit (key prefix {KeyPrefix}).", key[..Math.Min(24, key.Length)]);

            return cached!;
        }

        string result = await _inner.CompleteJsonAsync(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

        if (LlmCompletionCacheWireAdmission.IsAdmissible(result))
            await _store.SetAsync(key, result, _ttl, cancellationToken);

        return result;
    }

    /// <inheritdoc />
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        if (!_enabled)
        {
            await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                               _inner,
                               systemPrompt,
                               userPrompt,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                yield return chunk;
            }

            yield break;
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        string key =
            CacheKeyPrefix
            + LlmCompletionCacheFingerprint.Compute(
                _partitionByScope,
                _deploymentName,
                systemPrompt,
                userPrompt,
                scope);

        string? cached = await _store.TryGetAsync(key, cancellationToken).ConfigureAwait(false);

        if (LlmCompletionCacheWireAdmission.IsAdmissible(cached))
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug("LLM completion cache hit for streaming (key prefix {KeyPrefix}).", key[..Math.Min(24, key.Length)]);

            foreach (string chunk in AgentCompletionStreamingBridge.SimulateChunks(cached!))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return chunk;
            }

            yield break;
        }

        System.Text.StringBuilder accumulator = new();

        await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                           _inner,
                           systemPrompt,
                           userPrompt,
                           maxTokens,
                           temperature,
                           cancellationToken).ConfigureAwait(false))
        {
            accumulator.Append(chunk);
            yield return chunk;
        }

        string assembled = accumulator.ToString();

        if (LlmCompletionCacheWireAdmission.IsAdmissible(assembled))
            await _store.SetAsync(key, assembled, _ttl, cancellationToken).ConfigureAwait(false);
    }
}
