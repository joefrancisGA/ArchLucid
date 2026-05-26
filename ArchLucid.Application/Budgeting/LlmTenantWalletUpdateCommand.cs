using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmTenantWalletUpdateCommand
{
    public bool? AutoReplenishEnabled { get; init; }

    public decimal? MonthlyCapUsd { get; init; }

    public string? StripeCustomerId { get; init; }

    public string? StripePaymentMethodId { get; init; }

    public byte[] ExpectedRowVersion { get; init; } = [];
}
