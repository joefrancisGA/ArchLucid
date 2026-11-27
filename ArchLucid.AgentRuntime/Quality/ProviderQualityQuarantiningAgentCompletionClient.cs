using System.Runtime.CompilerServices;

using ArchLucid.Core.Agents;

namespace ArchLucid.AgentRuntime.Quality;

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
        using ProviderQualityRecoveryResponse.Capture? capture =
            ProviderQualityRecoveryResponse.Begin(admission, IndependentProviderQualityObserver.IsObservingSecureNow);
        if (capture?.Probe.SecureNowChallenge is { } challenge)
        {
            // Reuse the admitted completion instead of making a second call. Do not send customer data on this lease.
            systemPrompt = SecureNowRecoveryChallenge.SystemPrompt;
            userPrompt = challenge.UserPrompt;
            maxTokens = Math.Min(maxTokens ?? 128, 128);
        }

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
