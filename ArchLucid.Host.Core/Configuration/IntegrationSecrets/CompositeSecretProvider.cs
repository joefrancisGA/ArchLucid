using ArchLucid.Core.Secrets;
using ArchLucid.Host.Core.Configuration.Secrets;

namespace ArchLucid.Host.Core.Configuration.IntegrationSecrets;

/// <summary>Reads secrets from the in-memory overlay first, then the inner provider (TB-600).</summary>
public sealed class CompositeSecretProvider(ISecretProvider inner, InMemoryIntegrationSecretStore overlay) : ISecretProvider
{
    private readonly ISecretProvider _inner = inner ?? throw new ArgumentNullException(nameof(inner));
    private readonly InMemoryIntegrationSecretStore _overlay =
        overlay ?? throw new ArgumentNullException(nameof(overlay));

    public async Task<string?> GetSecretAsync(string secretName, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secretName);

        if (_overlay.TryGet(secretName, out string? overlayValue) && !string.IsNullOrWhiteSpace(overlayValue))
            return overlayValue;

        return await _inner.GetSecretAsync(secretName, ct).ConfigureAwait(false);
    }
}
