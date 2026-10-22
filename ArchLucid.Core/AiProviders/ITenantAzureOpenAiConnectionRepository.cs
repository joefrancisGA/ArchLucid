namespace ArchLucid.Core.AiProviders;

public interface ITenantAzureOpenAiConnectionRepository
{
    Task<TenantAzureOpenAiConnectionRecord?> GetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<TenantAzureOpenAiConnectionRecord?> UpsertAsync(
        Guid tenantId,
        TenantAzureOpenAiConnectionUpsertCommand command,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<bool> UpdateProbeResultAsync(
        Guid tenantId,
        bool succeeded,
        string? message,
        CancellationToken cancellationToken);
}
