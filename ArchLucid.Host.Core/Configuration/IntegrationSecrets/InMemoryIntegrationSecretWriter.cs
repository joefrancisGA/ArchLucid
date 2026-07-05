using ArchLucid.Core.IntegrationSecrets;

namespace ArchLucid.Host.Core.Configuration.IntegrationSecrets;

public sealed class InMemoryIntegrationSecretWriter(InMemoryIntegrationSecretStore store) : IIntegrationSecretWriter
{
    private readonly InMemoryIntegrationSecretStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    public Task<bool> TryUpsertSecretAsync(string secretName, string secretValue, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secretName);
        ArgumentException.ThrowIfNullOrWhiteSpace(secretValue);

        _store.Upsert(secretName.Trim(), secretValue);

        return Task.FromResult(true);
    }
}
