using ArchLucid.Core.Agents;

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
