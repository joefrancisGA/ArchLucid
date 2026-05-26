namespace ArchLucid.Core.Budgeting;

public sealed class LlmTenantWalletUpdateSettingsRequest
{
    public Guid TenantId { get; init; }

    public bool? AutoReplenishEnabled { get; init; }

    public decimal? MonthlyCapUsd { get; init; }

    public string? StripeCustomerId { get; init; }

    public string? StripePaymentMethodId { get; init; }

    public byte[] ExpectedRowVersion { get; init; } = [];
}
