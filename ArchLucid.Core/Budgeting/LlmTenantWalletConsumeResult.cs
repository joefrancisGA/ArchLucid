namespace ArchLucid.Core.Budgeting;

public sealed class LlmTenantWalletConsumeResult
{
    public bool Succeeded { get; init; }

    public bool ConcurrencyConflict { get; init; }

    public bool InsufficientFunds { get; init; }

    public decimal BalanceAfterUsd { get; init; }

    public static LlmTenantWalletConsumeResult Conflict() =>
        new() { ConcurrencyConflict = true };

    public static LlmTenantWalletConsumeResult NotEnough() =>
        new() { InsufficientFunds = true };

    public static LlmTenantWalletConsumeResult Ok(decimal balanceAfterUsd) =>
        new() { Succeeded = true, BalanceAfterUsd = balanceAfterUsd };
}
