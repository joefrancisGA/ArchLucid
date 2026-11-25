using System.Runtime.CompilerServices;

namespace ArchLucid.AgentRuntime.Quality;

public sealed class ProviderQualityQuarantinedException(
    ProviderQualityKey key,
    DateTimeOffset? retryAfterUtc,
    string? reason)
    : InvalidOperationException(reason ?? "AI provider output is quarantined pending independent quality recovery.")
{
    public ProviderQualityKey Key { get; } = key;
    public DateTimeOffset? RetryAfterUtc { get; } = retryAfterUtc;
}

/// <summary>Admission decorator that reuses the normal fallback chain when independent quality quarantine is open.</summary>
public sealed class ProviderQualityQuarantiningAgentCompletionClient(
    IAgentCompletionClient inner,
    IProviderQualityMonitor monitor) : IAgentStreamingCompletionClient, IDisposable
{
    private readonly IAgentCompletionClient _inner = inner ?? throw new ArgumentNullException(nameof(inner));
    private readonly IProviderQualityMonitor _monitor = monitor ?? throw new ArgumentNullException(nameof(monitor));

    public LlmProviderDescriptor Descriptor => _inner.Descriptor;

    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ProviderQualityAdmission admission = await AdmitAsync(cancellationToken).ConfigureAwait(false);
        using ProviderQualityRecoveryResponse.Capture? capture = ProviderQualityRecoveryResponse.Begin(admission);
        string response = await _inner.CompleteJsonAsync(
            systemPrompt, userPrompt, maxTokens, temperature, cancellationToken).ConfigureAwait(false);
        return capture?.Attach(response) ?? response;
    }

    public IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default) =>
        StreamCore(systemPrompt, userPrompt, maxTokens, temperature, cancellationToken);

    private async IAsyncEnumerable<string> StreamCore(
        string systemPrompt,
        string userPrompt,
        int? maxTokens,
        float? temperature,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await AdmitAsync(cancellationToken).ConfigureAwait(false);
        // Streaming, cancellation and failures without a trace must not raise or release a different lease.
        await foreach (string chunk in AgentCompletionStreamingBridge.StreamJsonAsync(
                           _inner, systemPrompt, userPrompt, maxTokens, temperature, cancellationToken)
                           .ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return chunk;
        }
    }

    private async Task<ProviderQualityAdmission> AdmitAsync(CancellationToken cancellationToken)
    {
        ProviderQualityAdmission admission = await _monitor.AdmitAsync(
            Descriptor.ProviderKind, Descriptor.ModelId, cancellationToken).ConfigureAwait(false);
        if (!admission.Allowed)
            throw new ProviderQualityQuarantinedException(CurrentKey(), admission.RetryAfterUtc, admission.Reason);
        return admission;
    }

    private ProviderQualityKey CurrentKey() =>
        ProviderQualityKey.Create(Descriptor.ProviderKind, Descriptor.ModelId, "unknown");

    public void Dispose()
    {
        if (_inner is IDisposable disposable)
            disposable.Dispose();
    }
}
