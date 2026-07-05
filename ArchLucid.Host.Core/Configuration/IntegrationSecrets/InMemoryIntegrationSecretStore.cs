namespace ArchLucid.Host.Core.Configuration.IntegrationSecrets;

/// <summary>In-process secret overlay for local dev and tests (TB-600 OAuth consent).</summary>
public sealed class InMemoryIntegrationSecretStore
{
    private readonly System.Collections.Concurrent.ConcurrentDictionary<string, string> _secrets = new(StringComparer.OrdinalIgnoreCase);

    public bool TryGet(string secretName, out string? value) =>
        _secrets.TryGetValue(secretName, out value);

    public void Upsert(string secretName, string secretValue) =>
        _secrets[secretName] = secretValue;
}
