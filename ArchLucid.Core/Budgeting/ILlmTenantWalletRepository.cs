namespace ArchLucid.Core.Budgeting;

/// <summary>Durable LLM prepaid wallet with optimistic concurrency (TB-014).</summary>
public interface ILlmTenantWalletRepository
{
    Task<LlmTenantWalletStateReadModel> GetOrCreateAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<LlmTenantWalletStateReadModel?> UpdateSettingsAsync(
        LlmTenantWalletUpdateSettingsRequest request,
        CancellationToken cancellationToken = default);

    Task<LlmTenantWalletConsumeResult> TryConsumeAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default);

    Task<LlmTenantWalletCreditResult> TryCreditRefillAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string? stripePaymentIntentId,
        int utcYearMonth,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default);

    Task<bool> TryInsertStripeWebhookIdempotencyAsync(
        string stripeEventId,
        string eventType,
        CancellationToken cancellationToken = default);

    Task<bool> LedgerContainsPaymentIntentAsync(
        string stripePaymentIntentId,
        CancellationToken cancellationToken = default);
}
