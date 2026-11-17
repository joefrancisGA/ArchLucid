namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecureNowQuestionDispositionRepository
{
    Task<IReadOnlyList<SecureNowQuestionDispositionRecord>> ListByTenantAndSubscriptionAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken = default);

    Task<SecureNowQuestionDispositionRecord?> TryGetByIdentityAsync(
        Guid tenantId,
        string subscriptionId,
        string resourceId,
        string questionKey,
        CancellationToken cancellationToken = default);

    Task<bool> TryUpsertAsync(
        SecureNowQuestionDispositionRecord record,
        int? expectedAuditEntryCount,
        CancellationToken cancellationToken = default);
}
