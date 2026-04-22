using ArchLucid.Contracts.Integrations;

namespace ArchLucid.Persistence.Data.Repositories;

public interface ITenantTeamsIncomingWebhookConnectionRepository
{
    Task<TeamsIncomingWebhookConnectionResponse?> GetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<TeamsIncomingWebhookConnectionResponse?> UpsertAsync(
        Guid tenantId,
        string keyVaultSecretName,
        string? label,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken);
}
