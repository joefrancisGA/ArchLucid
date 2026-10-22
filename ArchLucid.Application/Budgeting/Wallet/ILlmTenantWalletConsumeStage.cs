using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting.Wallet;

public interface ILlmTenantWalletConsumeStage
{
    Task<LlmTenantWalletStateReadModel> GetOrCreateAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<LlmTenantWalletStateReadModel?> UpdateWalletAsync(
        Guid tenantId,
        LlmTenantWalletUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<bool> TryAuthorizeOverageSpendAsync(
        Guid tenantId,
        decimal estimatedUsd,
        CancellationToken cancellationToken = default);

    Task ConsumeInternalAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken);

    Task ReconcileOverageInternalAsync(
        Guid tenantId,
        decimal actualUsd,
        decimal authorizedUsd,
        Guid correlationId,
        CancellationToken cancellationToken);
}
