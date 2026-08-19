namespace ArchLucid.Core.Budgeting;

public sealed class LlmTenantWalletCreditResult
{
    public bool Succeeded { get; init; }

    public bool ConcurrencyConflict { get; init; }

    public bool DuplicatePaymentIntent { get; init; }

    public decimal BalanceAfterUsd { get; init; }

    public static LlmTenantWalletCreditResult Conflict() =>
        new() { ConcurrencyConflict = true };

    public static LlmTenantWalletCreditResult Duplicate() =>
        new() { DuplicatePaymentIntent = true };

    public static LlmTenantWalletCreditResult Ok(decimal balanceAfterUsd) =>
        new() { Succeeded = true, BalanceAfterUsd = balanceAfterUsd };
}
