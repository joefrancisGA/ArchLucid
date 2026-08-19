namespace ArchLucid.Core.IntegrationSecrets;

/// <summary>Persists integration secrets (e.g. OAuth refresh tokens) into tenant-bound secret storage (TB-600).</summary>
public interface IIntegrationSecretWriter
{
    Task<bool> TryUpsertSecretAsync(string secretName, string secretValue, CancellationToken cancellationToken);
}
