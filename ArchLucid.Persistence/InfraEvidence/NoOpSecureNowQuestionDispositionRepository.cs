namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpSecureNowQuestionDispositionRepository : ISecureNowQuestionDispositionRepository
{
    public Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListByTenantAndSubscriptionAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<SecureNowQuestionDispositionRecord>>([]);
    }

    public Task<SecureNowQuestionDispositionRecord?> TryGetByIdentityAsync(
        Guid tenantId,
        string subscriptionId,
        string resourceId,
        string questionKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<SecureNowQuestionDispositionRecord?>(null);
    }

    public Task<bool> TryUpsertAsync(
        SecureNowQuestionDispositionRecord record,
        int? expectedAuditEntryCount,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(true);
    }
}
