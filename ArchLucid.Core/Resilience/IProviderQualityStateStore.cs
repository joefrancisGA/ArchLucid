namespace ArchLucid.Core.Resilience;

/// <summary>Atomically reads and updates one hosted deployment's quality state. State contains no raw evidence.</summary>
public interface IProviderQualityStateStore
{
    /// <summary>Serializes concurrent operations on a deployment; a null replacement performs no write.</summary>
    Task<TResult> UpdateAsync<TResult>(
        string deploymentKey,
        Func<string?, (string? Replacement, TResult Result)> update,
        CancellationToken cancellationToken);
}
